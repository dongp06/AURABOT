import { ICommand, IRunParams } from '../../types';

const quotes = [
    "Hãy sống như thể ngày mai là ngày cuối cùng!",
    "Thành công không đến với những người chờ đợi.",
    "Hãy làm những gì bạn yêu thích!",
    "Đừng sợ thất bại, hãy sợ không dám thử!",
    "Mỗi ngày là một cơ hội mới để bắt đầu lại.",
    "Hạnh phúc không phải là đích đến, mà là hành trình.",
    "Thời gian là tài sản quý giá nhất.",
    "Hãy tin vào chính mình!"
];

const command: ICommand = {
    config: {
        name: "quote",
        version: "1.0.0",
        author: "Donix",
        description: "Xem câu nói hay ngẫu nhiên",
        category: "Fun"
    },

    run: async ({ api, event }: IRunParams) => {
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
        api.sendMessage(`"${randomQuote}"`, event.threadID);
    }
};

export = command;
