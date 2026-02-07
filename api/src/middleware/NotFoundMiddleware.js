export default function NotFoundMiddleware(req, res, next) {
    res.status(404).json({
        error: {
            message: 'Route not found',
            statusCode: 404
        }
    });
}
