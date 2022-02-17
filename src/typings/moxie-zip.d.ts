// Note: This is not a full implementation, only what's required for this project
declare module 'moxie-zip' {
  class ZipWriter {
    public constructor();

    public addData(zipPath: string, data: any): void;
    public saveAs(filePath: string, callback: (err?: Error) => void): void;
  }
}