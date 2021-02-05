import { Batch } from "../../types";

export const hasValidBaseURL = (baseURL: string | undefined, urls: Batch.BatchUrl[]): boolean => {
    let isValid = true;

    try {
        new URL(urls[0].url);
    } catch {
        if (!baseURL) {
            isValid = false;
        }
    }
    return isValid;
}