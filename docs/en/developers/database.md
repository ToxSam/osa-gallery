---
title: "Avatar Database (GitHub)"
description: "Access all avatar metadata as JSON files - perfect for integrating into your app or game"
---

# Avatar Database (GitHub)

Access all avatar metadata as JSON files - perfect for integrating into your app or game.

[View Avatar Database →](https://github.com/toxsam/open-source-avatars)

## Structure

```
/data/
  projects.json → All collections + license info
  /avatars/
    100avatars-r1.json → Individual avatar data
    100avatars-r2.json
    100avatars-r3.json
    [community collection files...]
```

## Example Project Entry

Here's an example of what a project/collection entry looks like in `projects.json`:

```json
{
  "id": "NeonGlitch86-collection",
  "name": "NeonGlitch86 Collection",
  "creator_id": "NeonGlitch86",
  "description": "Collections of avatars Created by NeonGlitch86",
  "is_public": true,
  "license": "CC0",
  "source_type": "nft",
  "source_network": ["ethereum", "shape"],
  "source_contract": [
    "0x776bd31ae5549eac9ed215b5db278229454d5bed",
    "0xe7ba6df2934c487bb49435394fdd4b80268e2d3c",
    "0xcdffc2fae679814913305c13edb86fe7967dbeea"
  ],
  "storage_type": ["github", "arweave", "ipfs"],
  "opensea_url": "https://opensea.io/NeonGlitch86/created",
  "created_at": "2026-01-25T00:00:00.000Z",
  "updated_at": "2026-01-25T00:00:00.000Z",
  "avatar_data_file": "avatars/NeonGlitch86.json"
}
```

### Project Field Descriptions

- **id**: Unique identifier for the collection
- **name**: Display name of the collection
- **creator_id**: ID of the creator/artist
- **description**: Text description of the collection
- **is_public**: Whether the collection is publicly available
- **license**: License type (CC0, CC-BY, etc.)
- **source_type**: Type of source (e.g., "nft", "original")
- **source_network**: Blockchain network(s) where the collection exists (can be array or string)
- **source_contract**: Contract address(es) for NFT collections (can be array or string)
- **storage_type**: Where files are stored (can be array or string: "ipfs", "arweave", "github", etc.)
- **opensea_url**: Link to OpenSea collection page (if applicable)
- **created_at**: ISO timestamp when collection was created
- **updated_at**: ISO timestamp when collection was last updated
- **avatar_data_file**: Path to the JSON file containing individual avatar data

## Each avatar includes:

- Direct VRM download link
- Preview images
- Metadata and traits
- License information

## Example Avatar Entry

Here's an example of what an avatar entry looks like in the JSON files:

```json
{
  "id": "0x776bd31ae5549eac9ed215b5db278229454d5bed/2",
  "name": "PEPE Trash Can",
  "project_id": "NeonGlitch86-collection",
  "description": "PEPE Trash Can 3d .glb\n\nVRM",
  "model_file_url": "https://bafybeig4dmkps7kxuacwnw2v5ygas55bondtyzt73y4hqtev425ojgfjfi.ipfs.w3s.link/ipfs/bafybeig4dmkps7kxuacwnw2v5ygas55bondtyzt73y4hqtev425ojgfjfi/Pepe_TrashCan.vrm",
  "format": "VRM",
  "is_public": true,
  "is_draft": false,
  "created_at": "2025-11-11T11:22:00.434Z",
  "updated_at": "2025-11-11T11:22:00.434Z",
  "thumbnail_url": "https://arweave.net/1jt15-ExqQ0VAeyWPqSqrnN9Sk5QRq6gIOtrD7NYiCE",
  "metadata": {
    "token_id": "2",
    "attributes": [
      {
        "trait_type": "Artist",
        "value": "NeonGlitch86"
      }
    ],
    "external_url": "https://opensea.io/item/ethereum/0x776bd31ae5549eac9ed215b5db278229454d5bed/2",
    "alternateModels": {
      "glb": "https://arweave.net/GVX5MnpG7DJoGOyMC2O97fYziapTTfHWyql8nWzTKUk"
    }
  }
}
```

### Field Descriptions

- **id**: Unique identifier for the avatar (usually contract address + token ID)
- **name**: Display name of the avatar
- **project_id**: ID of the collection this avatar belongs to
- **description**: Text description of the avatar
- **model_file_url**: Direct download URL for the VRM file
- **format**: File format (typically "VRM")
- **is_public**: Whether the avatar is publicly available
- **is_draft**: Whether the avatar is still in draft status
- **thumbnail_url**: URL to the preview/thumbnail image
- **metadata**: Additional metadata including:
  - **token_id**: NFT token ID (if applicable)
  - **attributes**: Array of trait attributes
  - **external_url**: Link to external page (e.g., OpenSea)
  - **alternateModels**: Links to alternate file formats (e.g., GLB)
