// TODO: finish

export default class GoogleAPIClient {
    static async getUserCalendars(user) {
        CalendarDAO.getCalendarByUser(user);
    }
}