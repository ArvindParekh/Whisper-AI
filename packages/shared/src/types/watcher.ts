export type syncFileType = "add" | "change" | "delete";

export interface syncFileRequestBody {
    filePath: string;
    fileContent: string;
    sessionId: string;
    type: syncFileType;
    timestamp: number;
}

export interface syncFileResponseBody {
    success: boolean;
    message?: string;
}