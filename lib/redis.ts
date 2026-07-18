import Redis from "ioredis";



declare global {
    var redis:Redis | undefined;
}



export const redis = global.redis ?? new Redis(process.env.REDIS_URL!);

redis.on("error", (err) => {
    console.error("Redis Error:", err);
  });


if(process.env.NODE_ENV !=="production"){
    global.redis = redis;
}