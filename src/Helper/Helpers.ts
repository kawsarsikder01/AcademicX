export const route = (path: string)=>{
    return `${process.env.BASE_URL}/${path}`
}

export function generateTrxId(): string {
    const timestamp = Date.now(); // milliseconds since epoch
    const random = Math.floor(Math.random() * 1e6); // random 6-digit number
    return `TRX-${timestamp}-${random}`;
  }