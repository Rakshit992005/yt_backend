import { Router } from "express";
import { loggoutUser, loginUser, refreshAccessTokene, registerUser } from "../controllers/usre.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middlerware.js";

const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount : 1,
        },
        {
            name : "coverImage",
            maxCount : 1,
        }

    ]),
    registerUser,
)

router.route("/login").post(loginUser)

router.route("/logout").post(verifyJWT , loggoutUser)

router.route("/refresh-token").post(refreshAccessTokene)


export default router