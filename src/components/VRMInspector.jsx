              <div className="min-h-full flex flex-col">
                <div className="flex-1">
                  {/* Hero Section */}
                  <div className="px-6 py-8">
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8">
                      <div className="relative z-10">
                        <h2 className="text-3xl font-bold text-gray-900 mb-3">Welcome to VRM Inspector</h2>
                        <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                          A powerful tool for analyzing and exploring VRM files. Dive into your 3D models with detailed insights and controls.
                        </p>
                        <div className="flex gap-3">
                          <button
                            onClick={() => fileInputRef.current.click()}
                            className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 transition-colors"
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Open VRM File
                          </button>
                          <a
                            href="https://github.com/ToxSam/vrm-inspector"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-cream/50 hover:bg-cream/80 transition-colors"
                          >
                            Learn More
                          </a>
                        </div>
                      </div>
                      {/* Decorative elements */}
                      <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-48 h-48 bg-blue-200/20 rounded-full blur-3xl"></div>
                      <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-48 h-48 bg-purple-200/20 rounded-full blur-3xl"></div>
                    </div>
                  </div>

                  {/* Features Grid */}
                  <div className="px-6 mt-12">
                    <div className="flex items-center gap-2 mb-6">
                      <span className="text-xl">✨</span>
                      <h3 className="text-sm font-semibold text-gray-900">Key Features</h3>
                    </div>

                    <div className="flex gap-8">
                      {/* Left Column */}
                      <div className="flex-1 space-y-6">
                        {/* Model Information */}
                        <div className="flex items-start gap-3">
                          <Info className="h-5 w-5 flex-none text-blue-600" />
                          <div>
                            <h4 className="text-base font-medium text-gray-900">Model Information</h4>
                            <p className="mt-1 text-gray-600">View comprehensive metadata, including author details and licensing.</p>
                          </div>
                        </div>

                        {/* Expression Control */}
                        <div className="flex items-start gap-3">
                          <Layers className="h-5 w-5 flex-none text-green-600" />
                          <div>
                            <h4 className="text-base font-medium text-gray-900">Expression Control</h4>
                            <p className="mt-1 text-gray-600">Test and preview facial expressions and blendshapes.</p>
                          </div>
                        </div>
                      </div>

                      {/* Right Column */}
                      <div className="flex-1 space-y-6">
                        {/* Texture Analysis */}
                        <div className="flex items-start gap-3">
                          <Image className="h-5 w-5 flex-none text-purple-600" />
                          <div>
                            <h4 className="text-base font-medium text-gray-900">Texture Analysis</h4>
                            <p className="mt-1 text-gray-600">Examine and download model textures with format details.</p>
                          </div>
                        </div>

                        {/* Technical Details */}
                        <div className="flex items-start gap-3">
                          <Code className="h-5 w-5 flex-none text-amber-600" />
                          <div>
                            <h4 className="text-base font-medium text-gray-900">Technical Details</h4>
                            <p className="mt-1 text-gray-600">Access raw metadata and model statistics.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Tips */}
                  <div className="px-6 py-8">
                    <div className="bg-cream/50 backdrop-blur-sm border border-gray-100 rounded-xl p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-xl">💡</span>
                        <h3 className="font-medium text-gray-900">Quick Tips</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-start gap-3">
                          <span className="text-xl">👆</span>
                          <div>
                            <p className="text-sm text-gray-600">Left-click to orbit, right-click to pan, scroll to zoom</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <span className="text-xl">🔍</span>
                          <div>
                            <p className="text-sm text-gray-600">Toggle wireframe and skeleton visualization</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <span className="text-xl">🎭</span>
                          <div>
                            <p className="text-sm text-gray-600">Test facial expressions with intuitive sliders</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div> 