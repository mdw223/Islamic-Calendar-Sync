import UserDAO from '../../model/db/dao/UserDOA.js';

export default async function LoginUser(req, res) {
    const user = await UserDAO.getUserByEmail(req.body.email);

    if (user) {
        // TODO: finish

    }
}