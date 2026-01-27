# OpenSourceAvatars.com

> 🌐 **日本語版はこちら / [Japanese version available here](README.ja.md)**

The central registry for discovering free and open source 3D avatars

🌐 [opensourceavatars.com](https://opensourceavatars.com)

A curated directory that makes it easy to find VRM avatars you can actually use - from CC0 public domain avatars to community NFT collections with clear licensing.

## What is this?

OpenSourceAvatars.com started as a showcase for ToxSam's CC0 avatar collection but has evolved into a discovery platform for all kinds of open source 3D avatars.

We aggregate avatars from multiple sources:

- **Original collections** (our CC0 avatars stored on Arweave)
- **Community NFT collections** (like VIPE Heroes, Grifter Squaddies)
- **Other creators' CC0 work** (coming soon)

Our mission: Make it dead simple to find quality avatars with transparent licensing.

## Current Collections

### ToxSam's Original Collections (CC0)

- **100Avatars R1, R2, R3** - 300+ avatars
- Multiple formats: VRM, FBX, voxel variants
- Permanently stored on ArDrive
- Use however you want, no attribution needed

### Community Collections

- **VIPE Heroes** - NFT avatars (CC-BY)
- **Grifter Squaddies** - [Add details]
- More being added regularly

Each collection clearly displays its license so you know exactly what you can do with it.

## Features

### 🔍 Browse & Filter

- Search by collection, style, or traits
- Filter by license type (CC0, CC-BY, etc.)
- Preview 3D models before downloading

### 🛠️ VRM Inspector

Advanced tool for analyzing VRM files:

- View metadata and technical specs
- Test facial expressions and blendshapes
- Examine textures and materials
- Visualize skeleton and wireframe

Access at `/vrmviewer`

### 🌐 Multilingual

Full Japanese localization available

### 📊 Developer-Friendly

All avatar data available as JSON via our data repository

## Technical Stack

- **Frontend**: Next.js, React, Tailwind CSS
- **Data Source**: open-source-avatars JSON repository
- **Storage**: Arweave (our avatars), IPFS (community collections)

## Architecture

Two-repository approach:

- **[osa-gallery](https://github.com/ToxSam/osa-gallery)** (this repo) - Website code and UI
- **[open-source-avatars](https://github.com/ToxSam/open-source-avatars)** - Avatar metadata and registry

This separation keeps data transparent and makes community contributions easier.

## What's VRM?

VRM is an open 3D avatar format that works across games, VR apps, and web browsers. Think of it as a universal avatar file.

Works with:

- VRChat, VSeeFace, VTuber apps
- Unity (UniVRM)
- Web (three-vrm)
- Unreal Engine (VRM4U)

## Development Story

Built in 4 days using Claude, ChatGPT, and Bolt.new, then continuously improved with Claude 3.7 Sonnet through Cursor. Proof that AI tools can help creators with limited coding experience build real applications.

## Roadmap

- ✅ Multi-collection support with clear licensing
- ✅ VRM Inspector tool
- ✅ Japanese localization
- 🔄 Add more community collections
- 🔄 Improved 3D viewer navigation
- 📋 Community submission system for new collections
- 📋 Advanced filtering (polygon count, style, etc.)

## Contributing

### Want to add a collection?

Submit via GitHub Discussions with:

- Collection info and license
- Links to VRM files (IPFS, Arweave, permanent hosting)
- Preview images

### Code contributions

Found a bug? Want to improve the UI? PRs welcome!

## Connect

- **Twitter**: [@ToxSam](https://twitter.com/ToxSam)
- **Website**: [ToxSam.com](https://toxsam.com)

## License

- **Website code**: MIT License
- **Avatar models**: Varies by collection - check individual collection licenses
- Our original avatars (100Avatars series) are **CC0 public domain**.
