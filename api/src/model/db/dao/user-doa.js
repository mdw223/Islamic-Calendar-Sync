export default class UserDAO {
    static async getUserByEmail(email) {
        DBConntection.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
            if (err) {
                throw err; // TODO: use logging
            }
        });
        // TODO: finish

    }
}