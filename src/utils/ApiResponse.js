class ApiResponse{
    constructor(statusCode , data , message = "Something Went Wrong")
    {
        this.statusCode = statusCode
        this.data = data
        this.message = message
        this.success = statusCode < 400
    }
}