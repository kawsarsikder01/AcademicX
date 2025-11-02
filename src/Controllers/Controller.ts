export class Controller {
  json(res: any, data: any, status: number = 200) {
    res.statusCode = status;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(data));
  }

  send(res: any, data: string, status: number = 200) {
    res.statusCode = status;
    res.setHeader("Content-Type", "text/plain");
    res.end(data);
  }
}
              