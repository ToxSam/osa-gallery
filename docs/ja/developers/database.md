---
title: "アバターデータベース（GitHub）"
description: "すべてのアバターメタデータをJSONファイルとしてアクセス - アプリやゲームに統合するのに最適"
---

# アバターデータベース（GitHub）

すべてのアバターメタデータをJSONファイルとしてアクセス - アプリやゲームに統合するのに最適。

[アバターデータベースを見る →](https://github.com/toxsam/open-source-avatars)

## 構造

```
/data/
  projects.json → すべてのコレクション + ライセンス情報
  /avatars/
    100avatars-r1.json → 個別のアバターデータ
    100avatars-r2.json
    100avatars-r3.json
    [コミュニティコレクションファイル...]
```

## プロジェクトエントリの例

`projects.json`のプロジェクト/コレクションエントリの例：

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

### プロジェクトフィールドの説明

- **id**：コレクションの一意の識別子
- **name**：コレクションの表示名
- **creator_id**：クリエイター/アーティストのID
- **description**：コレクションのテキスト説明
- **is_public**：コレクションが公開されているかどうか
- **license**：ライセンスタイプ（CC0、CC-BYなど）
- **source_type**：ソースのタイプ（例：「nft」、「original」）
- **source_network**：コレクションが存在するブロックチェーンネットワーク（配列または文字列）
- **source_contract**：NFTコレクションのコントラクトアドレス（配列または文字列）
- **storage_type**：ファイルが保存されている場所（配列または文字列：「ipfs」、「arweave」、「github」など）
- **opensea_url**：OpenSeaコレクションページへのリンク（該当する場合）
- **created_at**：コレクションが作成されたISOタイムスタンプ
- **updated_at**：コレクションが最後に更新されたISOタイムスタンプ
- **avatar_data_file**：個別のアバターデータを含むJSONファイルへのパス

## 各アバターには以下が含まれます：

- 直接VRMダウンロードリンク
- プレビュー画像
- メタデータと特性
- ライセンス情報

## アバターエントリの例

JSONファイル内のアバターエントリの例：

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

### フィールドの説明

- **id**：アバターの一意の識別子（通常はコントラクトアドレス + トークンID）
- **name**：アバターの表示名
- **project_id**：このアバターが属するコレクションのID
- **description**：アバターのテキスト説明
- **model_file_url**：VRMファイルへの直接ダウンロードURL
- **format**：ファイル形式（通常は「VRM」）
- **is_public**：アバターが公開されているかどうか
- **is_draft**：アバターがまだドラフトステータスかどうか
- **thumbnail_url**：プレビュー/サムネイル画像へのURL
- **metadata**：追加のメタデータ、以下を含む：
  - **token_id**：NFTトークンID（該当する場合）
  - **attributes**：特性属性の配列
  - **external_url**：外部ページへのリンク（例：OpenSea）
  - **alternateModels**：代替ファイル形式へのリンク（例：GLB）



---

<small>

本ウェブサイトの翻訳はAIツールを使用して作成されました。
ご不便やご迷惑をおかけした場合、深くお詫び申し上げます。
ご理解いただき、ありがとうございます。
問題を発見された場合は、お気軽にお問い合わせください。
ありがとうございます。

</small>
