
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
            return 'Today';
        else if(days_diff == 1)
            return 'Tomorrow';
        else if(days_diff == -1)
            return 'Yesterday';
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

export function dayName(d)
{
    switch(d)
    {
    case 0:
        return 'Sun';
    
    case 1:
        return 'Mon';

    case 2:
        return 'Tue';

    case 3:
        return 'Wed';

    case 4:
        return 'Thu';

    case 5:
        return 'Fri';

    case 6:
        return 'Sat';
    
    case 7:
        return 'Sun';
    }

    return '';
}

export function monthName(m)
{
    switch(m)
    {
        case 0:
            return "Jan";
        case 1:
            return "Feb";
        case 2:
            return "Mar";
        case 3:
            return "Apr";
        case 4:
            return "May";
        case 5:
            return "Jun";
        case 6:
            return "Jul";
        case 7:
            return "Aug";
        case 8:
            return "Sep";
        case 9:
            return "Oct";
        case 10:
            return "Nov";
        case 11:
            return "Dec";
    }

    return '';
}