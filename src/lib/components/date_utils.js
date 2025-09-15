
import {getCurrentLanguageKey} from '../i18n.js'

export function getFormattedStringDate(d, type = "datetime")
{
    if(!d)
        return '';

    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    let year = d.getFullYear();
    let hour = '' + d.getHours();
    let minutes = '' + d.getMinutes();

    if(day.length < 2)
        day = '0' + day;

    if(month.length < 2)
        month = '0' + month;

    if(hour.length < 2)
        hour = '0' + hour;

    if(minutes.length < 2)
        minutes = '0' + minutes;

    if(type == "datetime-local")
        return `${year}-${month}-${day} ${hour}:${minutes}`;
    else
        return `${year}-${month}-${day}`;
}

export function getNiceStringDateTime(d)
{
    const dt = getNiceStringDate(d);
    const tm = d.toLocaleTimeString(undefined, {
        timeStyle: 'short'
    })
    return `${dt}, ${tm}`
}


export function getNiceStringDate(d)
{
    if(!d)
        return '';

    let month = d.getMonth();
    let day = d.getDate();
    let year = d.getFullYear();

    const now = new Date( Date.now())
    let current_month = now.getMonth();
    let current_day = now.getDate();
    let current_year = now.getFullYear();

    let is_far_date = true;
    const far_date_threshold = 14*24*60*60*1000; // 14 days
    if(Math.abs( now.getTime() - d.getTime()) < far_date_threshold)
        is_far_date = false;

    if(year != current_year)
    {
        if(is_far_date)
            return `${day} ${monthName(month)} ${year}`
        else
            return `${dayName(d.getDay())}, ${day} ${monthName(month)}`
    }

    if(month != current_month)
    {
        if(is_far_date)
            return `${day} ${monthName(month)}`   
        else
            return `${dayName(d.getDay())}, ${day} ${monthName(month)}`
    }
    else
    {
        let day_of_week = d.getDay() // 0 == Sunday
        let current_day_of_week = now.getDay()

        if(day_of_week == 0)
            day_of_week = 7

        if(current_day_of_week == 0)
            current_day_of_week = 7;

        
        let days_diff = day - current_day;
        if(days_diff == 0)
            return today();
        else if(days_diff == 1)
            return tomorrow();
        else if(days_diff == -1)
            return yesterday();
        else if(days_diff > 0 && days_diff <= 7)
        {
            if(day_of_week > current_day_of_week)
                return dayName(day_of_week);
            else
                return `${dayName(day_of_week)}, ${d.getDate()} ${monthName(d.getMonth())}`
        }
        else if(days_diff > 0)
        {
            if(is_far_date)
                return `${d.getDate()} ${monthName(d.getMonth())}`
            else
                return `${dayName(day_of_week)}, ${d.getDate()} ${monthName(d.getMonth())}`
        }
        else if(days_diff < 0 && days_diff > -7)
        {
            if(day_of_week < current_day_of_week)
                return dayName(day_of_week);
            else
                return `${dayName(day_of_week)}, ${d.getDate()} ${monthName(d.getMonth())}`
        }
        else
        {
            if(is_far_date)
                return `${d.getDate()} ${monthName(d.getMonth())}`
            else
                return `${dayName(day_of_week)}, ${d.getDate()} ${monthName(d.getMonth())}`
        }
    }
}

function today()
{
    const lang = getCurrentLanguageKey()
    if(Object.keys(abbrCloseLang).includes(lang))
        return abbrCloseLang[lang][1]
    else
        return abbrCloseLang.en[1]
}

function tomorrow()
{
    const lang = getCurrentLanguageKey()
    if(Object.keys(abbrCloseLang).includes(lang))
        return abbrCloseLang[lang][2]
    else
        return abbrCloseLang.en[2]
}

function yesterday()
{
    const lang = getCurrentLanguageKey()
    if(Object.keys(abbrCloseLang).includes(lang))
        return abbrCloseLang[lang][0]
    else
        return abbrCloseLang.en[0]
}


export function dayName(d)
{
    const lang = getCurrentLanguageKey()
    if(Object.keys(abbrDaysLang).includes(lang))
        return abbrDaysLang[lang][d]
    else
        return abbrDaysLang.en[d]
}

export function monthName(m)
{
    const lang = getCurrentLanguageKey()
    if(Object.keys(abbrMonthsLang).includes(lang))
        return abbrMonthsLang[lang][m]
    else
        return abbrMonthsLang.en[m]
}

// translations

const abbrCloseLang = {
    en: ['yesterday', 'today', 'tomorrow'],
    es: ['ayer', 'hoy', 'mañana'],
    pl: ['wczoraj', 'dziś', 'jutro']
}

const abbrDaysLang = {
    en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    es: ['dom', 'lun', 'mar', 'miérc', 'juev', 'vier', 'sáb', 'dom'],
    pl: ['nie', 'pon', 'wto', 'śro', 'czw', 'pią', 'sob', 'nie'] 
}

const abbrMonthsLang = {
    en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    es: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'set', 'oct', 'nov', 'dic'],
    pl: ['sty', 'lut', 'mar', 'kwi', 'maj', 'cze', 'lip', 'sie', 'wrz', 'paź', 'lis', 'gru']
}