let months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
let days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

const getDay = (timeStamp) => {
    let date = new Date(timeStamp);

    return `${date.getDate()} ${months[date.getMonth()]}`;
}

export default getDay;

export const getFullDay = (timeStamp) => {
    let date = new Date (timeStamp);

    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
}