export const checkHostIntegrity = (degradationChecks: {[key:string]: number}, degradationMax: number): boolean => {
    let shouldStop = false;
    for (let item in degradationChecks) {
        if (degradationChecks[item] >= degradationMax) {
            shouldStop = true;
        }
    }
    return shouldStop;
}