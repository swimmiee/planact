import { ITokenHeader } from "@/modules/auth/hooks"
import axios, { AxiosInstance } from "axios"
import dayjs from "dayjs"
import { Alert } from "react-native"
import { APP_BASE_URL } from "../host"

export type attachScheduleType = 'everyday' | 'interval' | 'weekdays';
interface AttachSchedulePropsBase {
    type: attachScheduleType
    schedule_id: string;
    token: ITokenHeader;
    start_date: Date | string;
    color: string;
}

interface IntervalProps extends AttachSchedulePropsBase{
    interval: number
}

interface WeekdaysProps extends AttachSchedulePropsBase {
    weekdays: boolean[]
}

interface AttachScheduleProps extends AttachSchedulePropsBase, IntervalProps, WeekdaysProps{}


export default function attachSchedule (props:(AttachScheduleProps)): Promise<any> {
    let {type, interval, weekdays, start_date, ...others} = props;
    if(others.color.indexOf("#")!==0 && 
        (others.color.length===7 || others.color.length===9)) 
        throw Error(`Not Color Type: ${others.color}`)
    start_date = dayjs(start_date).format('YYYY-MM-DD')

    return (
        type === 'weekdays'?
            attachScheduleWeekdays({...others, start_date, weekdays})
        :
        type === 'interval'?
            attachScheduleInterval({...others, start_date, interval})
            :
            attachScheduleEveryday({...others, start_date})
    )
}
const attachScheduleEveryday = async (props:Omit<AttachSchedulePropsBase, "type">) => {
    const {token, start_date, color, schedule_id} = props;
    return axios.post(
        `${APP_BASE_URL}schedule/attach/${schedule_id}`,
        {
            start_date,
            color
        },{headers: token}
    )
}
const attachScheduleInterval = async (props:Omit<IntervalProps, "type">) => {
    const {token, start_date, color, interval, schedule_id} = props;
    return axios.post(
        `${APP_BASE_URL}schedule/attach/${schedule_id}`,
        {
            start_date,
            color,
            interval
        },{headers: token}
    )
}

const attachScheduleWeekdays = async (props:Omit<WeekdaysProps, "type">) => {
    const {token, start_date, color, weekdays, schedule_id} = props;
    const weekday:string = weekdays.map((item, i) => item ? i : -1).filter(i => i>=0).join('');
    return axios.post(
        `${APP_BASE_URL}schedule/attach/${schedule_id}`,
        {
            start_date,
            color,
            weekday
        },{headers: token}
    )
}