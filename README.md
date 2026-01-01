# 🤖 AURABOT

AURABOT là một Facebook Chat Bot được xây dựng bằng TypeScript với hệ thống quản lý lệnh linh hoạt và dễ mở rộng.

## ✨ Tính năng

- 🎯 **Hệ thống lệnh mạnh mẽ**: Quản lý lệnh theo danh mục, hỗ trợ alias và kiểm tra quyền
- 🔧 **Dễ dàng mở rộng**: Cấu trúc module rõ ràng, dễ thêm lệnh mới
- 💾 **Database tích hợp**: Sử dụng Sequelize với SQLite để lưu trữ dữ liệu
- 📝 **Logging system**: Hệ thống log đầy đủ với màu sắc và timestamp
- 🛡️ **Permission system**: Hệ thống phân quyền cho owner và admin
- ⚡ **Hot reload**: Hỗ trợ load/unload lệnh mà không cần restart bot
- 🎨 **Event handlers**: Xử lý nhiều loại sự kiện (message, reaction, typing, presence, etc.)

## 📋 Yêu cầu

- Node.js >= 16.x
- npm hoặc yarn
- TypeScript >= 5.0.0

## 🚀 Cài đặt

### Cách 1: Sử dụng setup script (Khuyến nghị)

1. **Clone repository**
```bash
git clone <repository-url>
cd AURABOT
```

2. **Chạy setup script**
```bash
# Windows
setup.bat

# Linux/Mac
chmod +x setup.sh
./setup.sh

# Hoặc dùng npm (tự động chọn script phù hợp)
npm run setup
```

Script sẽ tự động:
- ✅ Kiểm tra Node.js và npm
- ✅ Cài đặt dependencies
- ✅ Tạo `config.json` từ `config.example.json`
- ✅ Thiết lập git để bảo vệ API key
- ✅ Hướng dẫn các bước tiếp theo

3. **Chỉnh sửa config.json**
   - Mở file `config.json` và thêm:
     - `externalApi.key`: API key của bạn
     - `permissions.owner`: Owner ID của bạn
     - Các cấu hình khác nếu cần

### Cách 2: Cài đặt thủ công

1. **Clone repository**
```bash
git clone <repository-url>
cd AURABOT
```

2. **Cài đặt dependencies**
```bash
npm install
```

3. **Cấu hình bot**
   - Copy `config.example.json` thành `config.json`:
     ```bash
     # Windows
     copy config.example.json config.json

     # Linux/Mac
     cp config.example.json config.json
     ```
   - Chỉnh sửa file `config.json`:
     - Đặt `prefix` cho bot (mặc định: `!`)
     - Thêm `owner` ID của bạn
     - Thêm `externalApi.key` (API key của bạn)
     - Cấu hình các thông số khác nếu cần

   - **Bảo vệ API key khỏi commit** (quan trọng!):
     ```bash
     # Windows
     scripts\setup-git.bat

     # Linux/Mac
     chmod +x scripts/setup-git.sh
     ./scripts/setup-git.sh
     ```

     Lệnh này sẽ khiến Git bỏ qua thay đổi trong `config.json`, giúp bạn giữ API key local mà không commit lên repository.

     **Lưu ý**: Nếu bạn đã commit `config.json` trước đó, hãy chạy lệnh trên để bảo vệ key của bạn.

4. **Chạy bot lần đầu**
```bash
# Development mode (với hot reload)
npm run dev

# Production mode
npm start
```

5. **Đăng nhập Facebook**
   - Khi chạy bot lần đầu, bạn sẽ cần đăng nhập Facebook
   - Bot sẽ tự động tạo file `appstate.json` sau khi đăng nhập thành công

# Build TypeScript
npm run build
```

## ⚙️ Cấu hình

File `config.json` chứa các cấu hình chính:

```json
{
  "bot": {
    "prefix": "!",
    "name": "AURABOT"
  },
  "paths": {
    "appstate": "./appstate.json",
    "commands": "./commands"
  },
  "api": {
    "forceLogin": true,
    "listenEvents": true,
    "logLevel": "error",
    "selfListen": false
  },
  "logger": {
    "level": "info",
    "enableColors": true,
    "enableTimestamp": true
  },
  "permissions": {
    "owner": "502275138",
    "admins": []
  }
}
```

### Các thông số quan trọng:

- **prefix**: Ký tự prefix cho lệnh (ví dụ: `!`, `.`, `/`)
- **owner**: Facebook UID của chủ bot
- **admins**: Mảng UID của các admin (có thể để trống)
- **logger.level**: Mức độ log (`info`, `warn`, `error`, `debug`)

## 📁 Cấu trúc dự án

```
AURABOT/
├── commands/           # Thư mục chứa các lệnh
│   ├── admin/         # Lệnh dành cho admin
│   ├── fun/           # Lệnh giải trí
│   └── system/        # Lệnh hệ thống
├── database/          # Database models và controllers
│   ├── models/        # Sequelize models
│   └── controllers/   # Database controllers
├── src/               # Source code chính
│   ├── handlers/      # Event handlers
│   ├── hooks/         # Hooks system
│   ├── utils/         # Utilities
│   ├── bot.ts         # Bot initialization
│   ├── client.ts      # Command client
│   ├── config.ts      # Config loader
│   └── main.ts        # Entry point
├── config.json        # File cấu hình
├── index.ts           # Entry point
└── package.json       # Dependencies
```

## 📝 Tạo lệnh mới

Tạo file mới trong thư mục `commands/<category>/<tên-lệnh>.ts`:

```typescript
import { ICommand, IRunParams } from '../../types';

const command: ICommand = {
    config: {
        name: "tên-lệnh",
        version: "1.0.0",
        author: "Tên bạn",
        description: "Mô tả lệnh",
        category: "Category",
        aliases: ["alias1", "alias2"], // Tùy chọn
        usages: "!tên-lệnh [args]",   // Tùy chọn
        role: 0 // 0: User, 1: Admin, 2: Owner
    },

    run: async ({ api, event, args, send, reply, react, Users, Threads }: IRunParams) => {
        // Code xử lý lệnh ở đây
        await send("Hello World!");
    }
};

export = command;
```

### Các helper functions có sẵn:

- `send(message)`: Gửi tin nhắn
- `reply(message)`: Reply tin nhắn
- `react(emoji)`: Thêm reaction
- `Users.getData(uid)`: Lấy dữ liệu user
- `Threads.getData(tid)`: Lấy dữ liệu thread

## 🎮 Lệnh có sẵn

### System Commands
- `!help [lệnh]` - Xem danh sách lệnh hoặc thông tin chi tiết
- `!info` - Thông tin về bot
- `!ping` - Kiểm tra độ trễ
- `!uptime` - Thời gian bot đã chạy

### Admin Commands
- `!ban @user` - Ban người dùng khỏi nhóm
- `!kick @user` - Kick người dùng khỏi nhóm
- `!load <tên-lệnh>` - Load lệnh mới
- `!unload <tên-lệnh>` - Unload lệnh
- `!uid` - Lấy UID của người dùng
- `!adduser <uid>` - Thêm người dùng vào nhóm
- `!eval <code>` - Chạy code JavaScript
- `!shell <command>` - Chạy shell command

### Fun Commands
- `!balance` - Xem số dư tiền và EXP
- `!daily` - Nhận phần thưởng hàng ngày
- `!coin` - Tung đồng xu
- `!dice` - Tung xúc xắc
- `!random [min] [max]` - Số ngẫu nhiên
- `!choose <option1> | <option2>` - Chọn ngẫu nhiên
- `!calc <biểu thức>` - Tính toán
- `!weather <địa điểm>` - Xem thời tiết
- `!quote` - Câu nói ngẫu nhiên
- `!top` - Bảng xếp hạng
- `!bot` - Bot trả lời tự động
- `!autosad` - Tự động phản ứng buồn

## 🔧 Development

### Scripts có sẵn:

```bash
# Chạy bot ở chế độ development (hot reload)
npm run dev

# Chạy bot ở chế độ production
npm start

# Build TypeScript sang JavaScript
npm run build
```

### TypeScript Configuration

Project sử dụng TypeScript với cấu hình strict mode. File `tsconfig.json` đã được cấu hình sẵn.

## 🗄️ Database

Bot sử dụng SQLite với Sequelize ORM. Database được tự động tạo khi chạy lần đầu.

### Models có sẵn:

- **User**: Lưu thông tin người dùng (money, exp, etc.)
- **Thread**: Lưu thông tin nhóm chat

## 🔐 Permissions

Hệ thống phân quyền 3 cấp:

- **Role 0**: User thường
- **Role 1**: Admin nhóm
- **Role 2**: Owner bot

## 📄 License

MIT License - Xem file [LICENSE](LICENSE) để biết thêm chi tiết.

## 👤 Author

**DongDev**

## ⚠️ Lưu ý

- Bot sử dụng Facebook Chat API không chính thức, có thể bị Facebook chặn
- Không chia sẻ file `appstate.json` - đây là thông tin đăng nhập của bạn
- Sử dụng bot một cách có trách nhiệm
- Tuân thủ Terms of Service của Facebook

## 🤝 Đóng góp

Mọi đóng góp đều được chào đón! Hãy tạo issue hoặc pull request.

## 📞 Hỗ trợ

Nếu gặp vấn đề, hãy tạo issue trên GitHub repository.

---

**Made with ❤️ by DongDev**
