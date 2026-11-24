import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from "@nestjs/common";
@Catch()
export class Errors implements ExceptionFilter {
  catch(error: any, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse();
    if (error instanceof HttpException) {
      return res.status(error.getStatus()).json(error.getResponse());
    }
    if (error?.code === "P2002")
      return res
        .status(409)
        .json({
          message: "Duplicate catalog key or offer. Review existing item.",
        });
    if (error?.code === "P2025")
      return res.status(404).json({ message: "Record not found" });
    if(error?.code==='P2034')return res.status(409).json({message:'Concurrent update, refresh and retry with the same request key'});
    new Logger("Request").error('Internal request failure');
    return res.status(500).json({ message: "Internal server error" });
  }
}
