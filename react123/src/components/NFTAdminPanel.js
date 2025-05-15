import { useState, useEffect } from 'react';
import { Copy, ChevronDown, ChevronUp, Download, Maximize2, Info, Heart, BarChart3, Share2 } from 'lucide-react';
import './NFTAdminPanel.css';

const NFTAdminPanel = () => {
  const [expandedSections, setExpandedSections] = useState({
    details: true,
    creators: false,
    attributes: true,
    description: true
  });
  const [imageSize, setImageSize] = useState('medium');

  const toggleSection = (section) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section]
    });
  };
  
  const cycleImageSize = () => {
    const sizes = ['small', 'medium', 'large'];
    const currentIndex = sizes.indexOf(imageSize);
    const nextIndex = (currentIndex + 1) % sizes.length;
    setImageSize(sizes[nextIndex]);
  };

  // Sample NFT data
  const nftData = {
    name: "Beaver NFT",
    tokenId: "CuD2wAPqc991CUYcNfRSg88RYmQQxMWrFMoJtjuU1XZF",
    owner: "HfshuqsyzeJTH5jsGLLViWY3meXLVchtdRCUEPDzL9Pr",
    image: "/api/placeholder/400/320",
    description: "Fair launch mint on Beavercrush.com! 994 unique Beavers, 5 ultra rare Evil Otters and only one Rabbit King! Look out for the very rare sharingan eyes Beavers.",
    mintAddress: "Beaver",
    mintAuthority: "-",
    updateAuthority: "-",
    collectionAddress: "-",
    tokenStandard: "NonFungible",
    tokenExtensions: true,
    royalties: "No Royalties Found",
    isOnCurve: true,
    attributes: [
      { type: "Background", value: "Plane" },
      { type: "Costume", value: "LederHosen" },
      { type: "Eyes", value: "BlueEyes" },
      { type: "Schnubbi", value: "None" },
      { type: "Headgear", value: "SantaHat" },
      { type: "Gadget", value: "GoldTooth" }
    ]
  };

  const CopyButton = ({ text }) => (
    <button className="text-blue-500 hover:text-blue-700 p-1 rounded transition-colors">
      <Copy size={14} />
    </button>
  );

  // Group attributes into pairs for 2-column layout
  const attributePairs = [];
  for (let i = 0; i < nftData.attributes.length; i += 2) {
    attributePairs.push(nftData.attributes.slice(i, i + 2));
  }
  // const CopyButton = ({ text }) => {
  //   const handleCopy = () => {
  //     navigator.clipboard.writeText(text);
  //   };
  // };
  return (
    

    <div className="bg-gray-900 text-white min-h-screen p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-4 md:gap-6">
          {/* Left Column - NFT Image & Description */}
          <div className="lg:w-1/3">
            <div className="bg-gray-800 rounded-lg overflow-hidden mb-4 flex justify-center items-center p-4">
              <div className={`relative transition-all duration-300 ${
                imageSize === 'small' ? 'w-32 h-32' : 
                imageSize === 'medium' ? 'w-40 h-40 md:w-48 md:h-48' : 
                'w-48 h-48 md:w-64 md:h-64'
              }`}>
                <img 
                  src={nftData.image} 
                  alt={nftData.name}
                  className="w-full h-full object-contain rounded-md"
                />
                <div className="absolute bottom-2 right-2 flex gap-2">
                  <button className="bg-gray-900 bg-opacity-50 p-1.5 rounded hover:bg-opacity-70 transition-all">
                    <Download size={16} />
                  </button>
                  <button 
                    onClick={cycleImageSize}
                    className="bg-gray-900 bg-opacity-50 p-1.5 rounded hover:bg-opacity-70 transition-all"
                  >
                    <Maximize2 size={16} />
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium">Description</h2>
                <button onClick={() => toggleSection('description')} className="p-1">
                  {expandedSections.description ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
              </div>
              {expandedSections.description && (
                <>
                  <p className="text-gray-300 text-sm">{nftData.description}</p>
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-700">
                    <div className="flex items-center gap-6">
                      <button className="flex items-center gap-1 text-gray-400 hover:text-pink-500 transition-colors">
                        <Heart size={16} />
                        <span className="text-xs">352</span>
                      </button>
                      <button className="flex items-center gap-1 text-gray-400 hover:text-blue-500 transition-colors">
                        <BarChart3 size={16} />
                        <span className="text-xs">Stats</span>
                      </button>
                      <button className="flex items-center gap-1 text-gray-400 hover:text-green-500 transition-colors">
                        <Share2 size={16} />
                        <span className="text-xs">Share</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right Column - NFT Details */}
          <div className="lg:w-2/3">
            <div className="mb-6">
              <div className="flex justify-between items-center">
                <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2 truncate">
                  {nftData.name}
                  <span className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded">NFT</span>
                </h1>
                <div className="flex gap-2">
                  <span className="text-xs px-2 py-1 bg-green-800 text-green-200 rounded">Active</span>
                  <span className="text-xs px-2 py-1 bg-blue-800 text-blue-200 rounded">Verified</span>
                </div>
              </div>
              <div className="flex items-center mt-1 text-xs md:text-sm text-gray-400">
                <span className="truncate mr-2">{nftData.tokenId}</span>
                <CopyButton text={nftData.tokenId} />
              </div>
            </div>

            {/* Details Section */}
            <div className="bg-gray-800 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 6h16M4 12h16M4 18h7" />
                  </svg>
                  <h2 className="text-lg font-medium">Details</h2>
                </div>
                <button onClick={() => toggleSection('details')} className="p-1">
                  {expandedSections.details ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
              </div>

              {expandedSections.details && (
                <div className="space-y-3">
                  <div className="flex justify-between py-1 border-b border-gray-700">
                    <span className="text-gray-400">OWNER</span>
                    <div className="flex items-center">
                      <span className="text-sm text-blue-400 truncate">{nftData.owner}</span>
                      <CopyButton text={nftData.owner} />
                    </div>
                  </div>

                  <div className="flex justify-between py-1 border-b border-gray-700">
                    <span className="text-gray-400">MINT ADDRESS</span>
                    <div className="flex items-center">
                      <span className="text-sm text-blue-400">{nftData.mintAddress}</span>
                      <CopyButton text={nftData.mintAddress} />
                    </div>
                  </div>

                  <div className="flex justify-between py-1 border-b border-gray-700">
                    <span className="text-gray-400">MINT AUTHORITY</span>
                    <div className="flex items-center">
                      <span className="text-sm">{nftData.mintAuthority}</span>
                      <CopyButton text={nftData.mintAuthority} />
                    </div>
                  </div>

                  <div className="flex justify-between py-1 border-b border-gray-700">
                    <span className="text-gray-400">UPDATE AUTHORITY</span>
                    <div className="flex items-center">
                      <span className="text-sm">{nftData.updateAuthority}</span>
                      <CopyButton text={nftData.updateAuthority} />
                    </div>
                  </div>

                  <div className="flex justify-between py-1 border-b border-gray-700">
                    <span className="text-gray-400">COLLECTION ADDRESS</span>
                    <div className="flex items-center">
                      <span className="text-sm">{nftData.collectionAddress}</span>
                      <CopyButton text={nftData.collectionAddress} />
                    </div>
                  </div>

                  <div className="flex justify-between py-1 border-b border-gray-700">
                    <span className="text-gray-400">TOKEN STANDARD</span>
                    <span className="text-sm">{nftData.tokenStandard}</span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-gray-700">
                    <div className="flex items-center">
                      <span className="text-gray-400 mr-1">TOKEN EXTENSIONS</span>
                      <Info size={14} className="text-gray-500" />
                    </div>
                    <span className="text-sm">{nftData.tokenExtensions ? "true" : "false"}</span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-gray-700">
                    <div className="flex items-center">
                      <span className="text-gray-400 mr-1">ROYALTIES</span>
                      <Info size={14} className="text-gray-500" />
                    </div>
                    <span className="text-sm">{nftData.royalties}</span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-gray-700">
                    <div className="flex items-center">
                      <span className="text-gray-400 mr-1">IS ON CURVE</span>
                      <Info size={14} className="text-gray-500" />
                    </div>
                    <span className="text-sm">{nftData.isOnCurve ? "true" : "false"}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Token Creators Section */}
            <div className="bg-gray-800 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="8" r="5" />
                    <path d="M20 21v-2a7 7 0 0 0-14 0v2" />
                  </svg>
                  <h2 className="text-lg font-medium">Token Creators</h2>
                </div>
                <button onClick={() => toggleSection('creators')} className="p-1">
                  {expandedSections.creators ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
              </div>
              
              {expandedSections.creators && (
                <div className="mt-4 text-gray-400 text-sm">
                  <p>No creator information available</p>
                </div>
              )}
            </div>

            {/* Attributes Section */}
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                  <h2 className="text-lg font-medium">Attributes</h2>
                  <span className="bg-gray-700 px-2 py-0.5 text-xs rounded-full">{nftData.attributes.length}</span>
                </div>
                <button onClick={() => toggleSection('attributes')} className="p-1">
                  {expandedSections.attributes ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
              </div>

              {expandedSections.attributes && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {nftData.attributes.map((attr, idx) => (
                    <div 
                      key={idx} 
                      className="bg-gray-700 rounded p-2 hover:bg-gray-600 transition-colors cursor-pointer"
                      style={{
                        borderLeft: `3px solid ${
                          ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981'][idx % 6]
                        }`
                      }}
                    >
                      <div className="text-xs text-gray-400">{attr.type}</div>
                      <div className="font-medium">{attr.value}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NFTAdminPanel;