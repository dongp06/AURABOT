import { ICommand, IRunParams } from '../../types';

const command: ICommand = {
    config: {
        name: "weather",
        version: "1.0.0",
        author: "Donix",
        description: "Xem thời tiết (mẫu)",
        category: "Fun",
        usages: "!weather <thành phố>"
    },

    run: async ({ api, event, args }: IRunParams) => {
        const city = args.join(' ') || "Hà Nội";

        const weather = {
            city: city,
            temp: Math.floor(Math.random() * 15) + 20,
            condition: ["☀️ Nắng", "☁️ Nhiều mây", "🌧️ Mưa", "⛅ Ít mây"][Math.floor(Math.random() * 4)]
        };

        const message = `🌤️ Thời tiết ${weather.city}:\n🌡️ Nhiệt độ: ${weather.temp}°C\n${weather.condition}`;
        api.sendMessage(message, event.threadID);
    }
};

export = command;
