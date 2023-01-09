/***
 * Get the message text from the value returned by catch
 * @param e
 */
export function getMessageFromCaughtElement(e: unknown) {
    if (e instanceof Error) {
        return e.message;
    } else if (typeof e === 'string') {
        return e;
    } else {
        console.error(e); // Log error in console since the real object isn't being returned
        return 'Something went wrong!';
    }
}