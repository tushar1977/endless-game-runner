import React from 'react';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';
import {
  Loader2, UserPlus, Sword, Shield, HeartPulse, Coins, Trophy,
  Calendar, Clock, Zap, Award, Shirt, BadgeCheck, Gamepad2, RefreshCw
} from 'lucide-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

const PlayerProfile = ({ program, connection }) => {
  const { publicKey, connected, signTransaction } = useWallet();
  const [profile, setProfile] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  React.useEffect(() => {
    if (publicKey && program) {
      fetchProfile();
    } else {
      setProfile(null);
    }
  }, [connected, publicKey, program]);
  const fetchProfile = async () => {
    if (!publicKey || !program) return;
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      const playerSeed = new TextEncoder().encode('player');
      const [playerPDA] = PublicKey.findProgramAddressSync(
        [playerSeed, publicKey.toBytes()],
        program.programId
      );

      const profileAccount = await program.account.playerProfile.fetch(playerPDA);
      setProfile(profileAccount);
      setShowCreateModal(false);
    } catch (err) {
      if (err.message?.includes('Account does not exist')) {
        setShowCreateModal(true);
      } else {
        setError(`Failed to fetch profile: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const initPlayer = async () => {
    if (!publicKey || !signTransaction || !program) {
      alert("Wallet not connected or doesn't support signing");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const playerSeed = new TextEncoder().encode('player');
      const walletSeed = new TextEncoder().encode('wallet');
      const [playerPDA] = PublicKey.findProgramAddressSync(
        [playerSeed, publicKey.toBytes()],
        program.programId
      );

      const [walletPDA] = PublicKey.findProgramAddressSync(
        [walletSeed, publicKey.toBytes()],
        program.programId
      );

      const tx = await program.methods
        .initPlayer()
        .accounts({
          playerAccount: playerPDA,
          signer: publicKey,
          wallet: walletPDA,
          systemProgram: SystemProgram.programId,
        })
        .transaction();

      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      tx.feePayer = publicKey;

      const signedTx = await signTransaction(tx);
      const rawTx = signedTx.serialize();
      const txSig = await connection.sendRawTransaction(rawTx);
      await connection.confirmTransaction(txSig, 'confirmed');

      await fetchProfile();
      setShowCreateModal(false);
    } catch (err) {
      setError(`Failed to initialize player: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!connected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-900 to-purple-800 p-6">
        <div className="max-w-md w-full bg-gray-900 rounded-xl shadow-2xl p-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-6">Welcome to the Arena!</h1>
          <p className="text-gray-300 mb-8">
            Connect your wallet to view your player stats and achievements
          </p>
          <div className="flex justify-center">
            <WalletMultiButton className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition-all" />
          </div>
        </div>
      </div>
    );
  }
  if (loading && !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <Loader2 className="animate-spin h-12 w-12 text-indigo-500" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
        <div className="bg-gray-900 rounded-xl shadow-2xl p-8 max-w-md w-full border border-indigo-500">
          <div className="text-center mb-6">
            <UserPlus className="mx-auto h-16 w-16 text-indigo-500 mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Create Your Player Profile</h2>
            <p className="text-gray-400">
              Start your journey by creating a player profile on the blockchain
            </p>
          </div>

          <div className="mb-6">
            <div className="flex items-center mb-3">
              <Trophy className="h-5 w-5 text-indigo-400 mr-2" />
              <span className="text-gray-300">Track your high scores and achievements</span>
            </div>
            <div className="flex items-center mb-3">
              <Coins className="h-5 w-5 text-indigo-400 mr-2" />
              <span className="text-gray-300">Earn and collect in-game currency</span>
            </div>
            <div className="flex items-center">
              <Shirt className="h-5 w-5 text-indigo-400 mr-2" />
              <span className="text-gray-300">Unlock and equip special skins</span>
            </div>
          </div>

          <div className="flex flex-col space-y-3">
            <button
              onClick={initPlayer}
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition-all flex items-center justify-center"
            >
              {loading ? (
                <Loader2 className="animate-spin h-5 w-5 mr-2" />
              ) : (
                <UserPlus className="h-5 w-5 mr-2" />
              )}
              Create Player Profile (0.01 SOL)
            </button>
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>
        </div>
      </div>
    );
  }

  // Format timestamp to readable date
  const formatDate = (timestamp) => {
    if (!timestamp || timestamp === 0) return "Never";
    return new Date(timestamp * 1000).toLocaleString();
  };

  // Format coins to a readable number
  const formatCoins = (amount) => {
    return amount?.toLocaleString() || "0";
  };

  return (
    <div className="min-h-screen bg-gray-900 p-4 md:p-8">
      {/* Top Navigation Bar with Wallet Button */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Game Dashboard</h1>
        <div className="flex items-center space-x-4">
          {profile && (
            <button
              onClick={fetchProfile}
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-all flex items-center"
            >
              {loading ? (
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh
            </button>
          )}
          <WalletMultiButton className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-all" />
        </div>
      </div>
      <div className="max-w-6xl mx-auto">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-indigo-700 to-purple-800 rounded-xl p-6 mb-6 shadow-lg">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-4 md:mb-0">
              <h1 className="text-2xl md:text-3xl font-bold text-white">Player Profile</h1>
              <p className="text-indigo-200">
                {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <div className="bg-indigo-900/50 rounded-lg p-3 flex items-center">
                <Trophy className="h-6 w-6 text-yellow-400 mr-2" />
                <div>
                  <p className="text-xs text-indigo-200">High Score</p>
                  <p className="text-xl font-bold text-white">
                    {formatCoins(profile.highScore)}
                  </p>
                </div>
              </div>

              <div className="bg-indigo-900/50 rounded-lg p-3 flex items-center">
                <Coins className="h-6 w-6 text-yellow-400 mr-2" />
                <div>
                  <p className="text-xs text-indigo-200">Total Coins</p>
                  <p className="text-xl font-bold text-white">
                    {formatCoins(profile.totalCoins)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatCard
            icon={<Gamepad2 className="h-6 w-6" />}
            title="Games Played"
            value={profile.gamesPlayed?.toLocaleString() || "0"}
            color="text-purple-400"
          />

          <StatCard
            icon={<Zap className="h-6 w-6" />}
            title="Daily Streak"
            value={`${profile.dailyStreak || 0} days`}
            color="text-green-400"
          />

          <StatCard
            icon={<Shirt className="h-6 w-6" />}
            title="Skins Owned"
            value={profile.skinsOwned?.length || "0"}
            color="text-blue-400"
          />

          <StatCard
            icon={<Calendar className="h-6 w-6" />}
            title="Last Daily Claim"
            value={formatDate(profile.lastDailyClaim)}
            color="text-yellow-400"
          />

          <StatCard
            icon={<Clock className="h-6 w-6" />}
            title="Last Game Played"
            value={formatDate(profile.lastGameTimestamp)}
            color="text-red-400"
          />

          <StatCard
            icon={<BadgeCheck className="h-6 w-6" />}
            title="Highscore NFT"
            value={profile.hasHighscoreNft ? "Owned" : "None"}
            color={profile.hasHighscoreNft ? "text-green-400" : "text-gray-400"}
          />
        </div>

        {/* Skin Display Section */}
        <div className="bg-gray-800 rounded-xl p-6 mb-8 border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center">
            <Shirt className="h-5 w-5 mr-2 text-indigo-400" />
            Equipped Skin
          </h2>

          {profile.equipped_skin ? (
            <div className="flex items-center">
              <div className="bg-indigo-900/20 rounded-lg p-4 mr-4 border border-indigo-500">
                <Shirt className="h-12 w-12 text-indigo-300" />
              </div>
              <div>
                <p className="text-gray-300 text-sm">Skin Address:</p>
                <p className="text-white font-mono text-sm">
                  {profile.equippedSkin.toString().slice(0, 6)}...{profile.equippedSkin.toString().slice(-4)}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-gray-400">No skin equipped</p>
          )}
        </div>

        {/* Highscore NFT Section */}
        {profile.has_highscore_nft && (
          <div className="bg-gray-800 rounded-xl p-6 border border-yellow-500/30">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center">
              <Award className="h-5 w-5 mr-2 text-yellow-400" />
              Highscore Achievement NFT
            </h2>

            <div className="flex items-center">
              <div className="bg-yellow-900/20 rounded-lg p-4 mr-4 border border-yellow-500">
                <Award className="h-12 w-12 text-yellow-300" />
              </div>
              <div>
                <p className="text-gray-300 text-sm">NFT Mint Address:</p>
                <p className="text-white font-mono text-sm">
                  {profile.highscoreNftMint.toString().slice(0, 6)}...{profile.highscoreNftMint.toString().slice(-4)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Reusable StatCard component
const StatCard = ({ icon, title, value, color }) => (
  <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-indigo-500 transition-all">
    <div className="flex items-center mb-2">
      <div className={`mr-2 ${color}`}>{icon}</div>
      <h3 className="text-gray-300 font-medium">{title}</h3>
    </div>
    <p className="text-white text-2xl font-bold">{value}</p>
  </div>
);

export default PlayerProfile;
