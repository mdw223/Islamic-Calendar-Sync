export default function ErrorHandlerMiddleware(err, req, res, next) {
    console.error(err.stack);
    
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    
    res.status(statusCode).json({
        error: {
            message,
            statusCode,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        }
    });
}
