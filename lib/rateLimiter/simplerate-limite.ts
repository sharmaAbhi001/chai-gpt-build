import { redis } from "../redis";


const  RATE_LIMIT = 3;
const WINDOW_SECONDS = 60;
const BLOCK_SECONDS = 300;


export default async function simpleRateLimiter(userid:string) {

    const counterkey:string = `rateLimiter:${userid}`;
    const blockkey:string = `rateLimiter:block${userid}`;

    console.log("it run")


    const blocked = await redis.get(blockkey);
    if(blocked){
        return new Response("Too many request", { status: 429});
    }

    const count = await redis.incr(counterkey);

    if(count===1){
        await redis.expire(counterkey,WINDOW_SECONDS)
    }

    if(count>RATE_LIMIT){
        await redis.set(blockkey,"1","EX",BLOCK_SECONDS)
        return new Response("Too many reques", { status: 429});
    }
  
}




// so we have to create two redis string is blocked and one is frequency 