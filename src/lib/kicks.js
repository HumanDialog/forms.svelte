import {reef, session} from '@humandialog/auth.svelte'
import {get} from 'svelte/store'

let nextObserverId = 1000
let registeredObservers = []
let minInterval = 0
let lastCheckAt = 0
let timerId = 0;

let lastKicks = new Map();

export function registerKicksObserver(labels, interval, callback)
{
    let lbs = []
    if(labels && Array.isArray(labels))
        lbs = labels
    else
        lbs = [labels]

    registeredObservers.push( {
        labels: lbs,
        interval: interval,
        callback: callback,
        id: nextObserverId
    })

    const res = nextObserverId;
    nextObserverId++;

    updateTimer()
    return res
}

export function unregisterKicksObserver(regId)
{
    const fIdx = registeredObservers.findIndex( (o) => o.id == regId)
    if(fIdx >=0)
        registeredObservers.splice(fIdx, 1)

    updateTimer()
}

export function forceKicksChecking()
{
    checkKicks();
    

    if(timerId > 0)
    {
        clearTimeout(timerId)
        timerId = 0
    }

    if(minInterval > 0)
        timerId = setTimeout(timerHandler, minInterval*1000)
}

function getMinInterval()
{
    if(registeredObservers.length == 0)
        return 0;

    let minInterval = Number.MAX_SAFE_INTEGER;
    registeredObservers.forEach((o) => {
        if(o.interval < minInterval)
            minInterval = o.interval
    })

    return minInterval;
}

function timerHandler()
{
    checkKicks();
    timerId = setTimeout(timerHandler, minInterval*1000)
}

function updateTimer()
{
    const newInterval = getMinInterval()
    
    let isFirstTimeLaunch = (timerId == 0) && (newInterval > 0)

    if(timerId > 0)
    {
        clearTimeout(timerId)
        timerId = 0
    }

    if(newInterval > 0)
        timerId = setTimeout(timerHandler, newInterval*1000)

    minInterval = newInterval

    if(isFirstTimeLaunch)
        checkKicks(false)
}

function checkKicks(informObservers=true)
{
    const s = get(session)
    const appId = s.appId ? s.appId : 'octopus'
    const tid = s.tid ? s.tid : 'octopus/13'
    console.log(s.isActive, appId, tid)
    if(s.isActive && appId && tid)
    {
        reef.fetch(`/dev/kicks?app_id=${appId}&tenant_id=${encodeURIComponent(tid)}&last_check=${lastCheckAt}`).then(res => {
            if(res.ok)
            {
                res.json().then( result =>
                {
                    // todo 
                    //console.log('kicks:', result)  


                    let changedLabels = []
                    result.allKicks.forEach(current => {
                        
                        if(lastKicks.has(current.label))
                        {
                            let storedKick = lastKicks.get(current.label)
                            if(storedKick.kick != current.kick)
                            {
                                lastKicks.set(current.label, {...current})
                                changedLabels.push(current.label)
                            }
                        }
                        else
                        {
                            lastKicks.set(current.label, {...current})
                            changedLabels.push(current.label)
                        }
                    })

                    if(informObservers && changedLabels.length > 0)
                    {
                        registeredObservers.forEach(ob => {
                            const changedLabelsPerObserver = ob.labels.filter(label => changedLabels.includes(label))
                            if(changedLabelsPerObserver.length > 0)
                            {
                                if(ob.callback)
                                    ob.callback(changedLabelsPerObserver)
                            }
                        })
                    }
                }
                ).catch(err => console.error(err))
            }
        }).catch(err => {
            console.error(err)
        })
    }
    
    lastCheckAt = Date.now() / 1000;
}