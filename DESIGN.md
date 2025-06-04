# 設計ルール

このドキュメントでは、myblogプロジェクトで使用するアーキテクチャパターンと設計ルールを定義します。

## アーキテクチャ概要

本プロジェクトでは、操作の種類に応じて異なるアーキテクチャパターンを採用しています：

- **Read系API**: Handler → Infrastructure（直接データベース呼び出し）
- **Write系API**: Handler → Usecase → Repository Interface

## レイヤー構成

### 1. Handler Layer (`api/internal/server/`)
- HTTPリクエストの受け取りとレスポンス返却を担当
- Ginフレームワークを使用したRESTful APIエンドポイント
- 操作種別に応じて適切な下位レイヤーを呼び出し

### 2. Usecase Layer (`api/internal/post/usecase/`)
- **Write系操作のみ**で使用
- ビジネスロジックの実装
- Repository Interfaceを通じてデータアクセス
- Input/Outputの型定義を含む

### 3. Repository Interface (`api/internal/post/repository/`)
- Write系操作のデータアクセス抽象化
- テスタビリティとコードの依存関係逆転を実現

### 4. Infrastructure Layer (`api/internal/post/rdb/`)
- データベースアクセスの実装
- MySQLとの実際の通信処理
- Repository Interfaceの実装

### 5. Entity Layer (`api/internal/post/entity/`)
- ドメインオブジェクトの定義
- ビジネスルールの実装
- バリデーション機能

### 6. DI Container (`api/internal/post/di/`)
- 依存性注入コンテナ
- シングルトンパターンでのインスタンス管理

## 操作種別ごとの設計パターン

### Read系API設計
Read系操作（データ取得）では、パフォーマンスとシンプルさを重視し、直接的なアプローチを採用します。

```
Handler → Infrastructure（RDB）
```

**実装例**:
```go
func (s *Server) PostsRead(c *gin.Context, id string) {
    // DIコンテナからDBインスタンス取得
    db, err := s.container.DB()
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "database connection failed"})
        return
    }

    // Entityでのバリデーション
    postID, err := post.ParsePostID(id)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "invalid post id"})
        return
    }

    // 直接RDBレイヤーを呼び出し
    foundPost, err := rdb.FindPostByID(c.Request.Context(), db, postID)
    if err != nil {
        // エラーハンドリング...
    }

    c.JSON(http.StatusOK, foundPost)
}
```

### Write系API設計
Write系操作（データ変更）では、ビジネスロジックの整理とテスタビリティを重視し、レイヤード・アーキテクチャを採用します。

```
Handler → Usecase → Repository Interface → Infrastructure（RDB）
```

**実装例**:
```go
func (s *Server) PostsCreate(c *gin.Context) {
    // DIコンテナからUsecase取得
    uc, err := s.container.CreatePostUsecase()
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get usecase"})
        return
    }

    // リクエストボディのパース
    var input struct {
        Title string `json:"title"`
        Body  string `json:"body"`
    }
    if err := c.ShouldBindJSON(&input); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
        return
    }

    // Usecaseの実行
    output, err := uc.Execute(c.Request.Context(), usecase.CreatePostInput{
        Title: input.Title,
        Body:  input.Body,
    })
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create post"})
        return
    }

    c.JSON(http.StatusOK, output.Post)
}
```

## ファイル・ディレクトリ構成

```
api/internal/
├── cmd/                    # アプリケーションエントリーポイント
├── server/                 # HTTPハンドラー
└── post/                   # Post関連の機能
    ├── di/                 # 依存性注入コンテナ
    ├── entity/             # エンティティ
    │   └── post/
    ├── usecase/            # ユースケース（Write系のみ）
    ├── repository/         # リポジトリインターフェース
    └── rdb/               # データベース実装
```

## 依存性注入（DI）パターン

### DIコンテナの実装
- シングルトンパターンを使用
- 遅延初期化でインスタンス生成
- データベース接続の管理

```go
type Container struct {
    db                 *sql.DB
    postRepo           repository.PostRepository
    createPostUsecase  *usecase.CreatePostUsecase
    // ... 他のコンポーネント
}
```

### DIの使用例
```go
// データベース接続の取得
db, err := container.DB()

// Repository の取得
repo, err := container.PostRepository()

// Usecase の取得
uc, err := container.CreatePostUsecase()
```

## エンティティ設計原則

### 1. バリデーションの実装
エンティティ内でビジネスルールとバリデーションを実装：

```go
func ValidateTitle(title string) error {
    validTitle := len(title) > 1 && len(title) <= 50
    if !validTitle {
        return errors.New("title must be between 1 and 50 characters")
    }
    return nil
}
```

### 2. ファクトリーメソッド
- `Construct()`: 新規作成時
- `Reconstruct()`: データベースからの復元時

```go
func Construct(title, body string) (*Post, error) {
    if err := ValidateForConstruct(title, body); err != nil {
        return nil, err
    }
    return &Post{
        ID:          NewPostID(),
        Title:       title,
        Body:        body,
        CreatedAt:   time.Now(),
        PublishedAt: time.Now(),
    }, nil
}
```

## データベースアクセスパターン

### MySQL UUID の処理
UUIDの保存・取得時はMySQL関数を使用：

```sql
-- 保存時
INSERT INTO posts (id, title, body, created_at, published_at) 
VALUES (UUID_TO_BIN(?), ?, ?, ?, ?)

-- 取得時
SELECT BIN_TO_UUID(id), title, body, created_at, published_at 
FROM posts WHERE id = UUID_TO_BIN(?)
```

### エラーハンドリング
- `sql.ErrNoRows`の適切な処理
- ビジネス例外とシステム例外の区別
- 影響行数チェックによるNot Foundエラーの検出

## テスト戦略

### Integration Test
- Docker環境での実際のデータベースを使用
- エンドツーエンドでのテスト実行

### Unit Test
- Repository Interfaceのモック化
- Usecaseの独立したテスト

## エラーハンドリング原則

### HTTPステータスコード
- `400 Bad Request`: バリデーションエラー、不正なリクエスト
- `404 Not Found`: リソースが見つからない
- `500 Internal Server Error`: システムエラー

### エラーメッセージ
- クライアント向けには汎用的なメッセージ
- ログには詳細なエラー情報を記録

## パフォーマンス考慮事項

### Read系API
- 中間レイヤーを排除してレスポンス時間を最小化
- データベースクエリの最適化

### Write系API
- ビジネスロジックの整理を優先
- テスタビリティとメンテナンス性を重視

## 今後の拡張方針

1. **Read系API**でも複雑なビジネスロジックが必要になった場合は、専用のQuery ServiceやQuery Usecaseの導入を検討
2. **CQRS**パターンの適用可能性を検討
3. **キャッシュ**戦略の導入
4. **非同期処理**の要件に応じた設計変更

---

この設計ルールは、現在の要件とチーム規模に最適化されており、プロジェクトの成長に応じて継続的に見直しを行います。