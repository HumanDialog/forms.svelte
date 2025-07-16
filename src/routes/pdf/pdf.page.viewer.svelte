<script context='module'>
    /* sample pdf entry:
    
   const entry = {
    url: 'url',
    pdfDocument: null,
    pdfLoadingTask: null
   }
    */
   
   let pdfs = []
</script>

<script>
	// @ts-nocheck
    import * as pdfjs from 'pdfjs-dist';
    import * as pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs';
    pdfjs.GlobalWorkerOptions.workerSrc = import.meta.url + 'pdfjs-dist/build/pdf.worker.mjs';

    import {points} from './points'
	import { remove, removeAt } from '$lib/utils';
	import { page } from '$app/stores';
    import {FaMapPin, FaMapMarker, FaMapMarkerAlt} from 'svelte-icons/fa'
    
	
    export let pageNo = 1;
    export let rotation = undefined
    export let scale = 1.0
    export let url;

    export function changeScale(_scale)
    {
        scale = _scale

        //1. Render by 
    }

    let canvasPdf;
    let svgTasks;
    
    let pdfDocument;
    let pdfPage;
    let pointsArray = []

    let tasksLayerDrawTrigger = 0
    let canvasWidth=0
    let canvasHeight=0

    $: init(pageNo, url)
    
    async function init(...args)
    {
        tasksLayerDrawTrigger = 0

        pdfDocument = await lookupDocument(url)
        const pagesNo = pdfDocument.numPages
        
        if(!pagesNo)
            return;
    
        if(pageNo > pageNo)
            pageNo = pagesNo;

        if(pageNo < 1)
            pageNo = 1;

        pointsArray = points[pageNo-1]

        pdfPage = await pdfDocument.getPage(pageNo)

        if(rotation === undefined)
            rotation = pdfPage.rotate

        rotation = normalizeRotation(rotation)

        let viewport = pdfPage.getViewport( {
                        scale: scale,
                        rotation: rotation
                    } );
        
        canvasWidth = viewport.width
        canvasHeight = viewport.height

        canvasPdf.width = canvasWidth
        canvasPdf.height = canvasHeight

        await renderPage(pdfPage, canvasPdf, viewport)

        renderTasks()
    }

    async function renderPage(pdfPage, canvas, viewport)
    {
        if(!canvas)
            return;

        if(!pdfPage)
            return;

        let ctx = canvas.getContext('2d');
        await pdfPage.render({
            canvasContext: ctx,
            viewport: viewport,
            annotationMode: pdfjs.AnnotationMode.DISABLE,
            background: null
        }).promise
 
    }

    function renderTasks()
    {
        tasksLayerDrawTrigger = tasksLayerDrawTrigger + 1;
    }

    function normalizeRotation(rotation)
    {
        let result = rotation;

        if(!result)
            return result;
        else if(result > 0)
        {
            const multiplicity = Math.floor( result / 90)
            result = multiplicity * 90;

            if(result >= 360)
                result = result % 360
        }
        else // < 0
        {
            result = Math.abs(result)
            const multiplicity = Math.floor( result / 90)
            result = multiplicity * 90;

            if(result >= 360)
                result = result % 360

            if(!result)
                return result
            else
                result = 360 - result
 
        }
        return result;
        
    }

    function LPtoDP(lp)
    {
        const dp = {
            x: lp.x,
            y: lp.y
        }

        dp.x *= scale
        dp.y *= scale

        const rad = rotation * Math.PI / 180
        const cos = Math.cos(rad)
        const sin = Math.sin(rad)

        const vpTL = {
            x: 0,
            y: 0
        }

        const dx = dp.x - vpTL.x 
        const dy = dp.y - vpTL.y
        const length = Math.sqrt(dx*dx+dy*dy)

        const rdx = dx * cos - dy * sin
        const rdy = dy * cos + dx * sin

        let rotVP;
        switch(rotation)
        {
        case 0:
            rotVP = {
                x: 0,
                y: 0
            }
            break;

        case 90:
            rotVP = {
                x: canvasWidth,
                y: 0
            }
            break;

        case 180:
            rotVP = {
                x: canvasWidth,
                y: canvasHeight
            }
            break;

        case 270:
            rotVP = {
                x: 0,
                y: canvasHeight
            }
        }

        dp.x = rotVP.x + rdx;
        dp.y = rotVP.y + rdy;

        return dp;
    }

    function DPtoLP(dp)
    {
        const lp = {
            x: dp.x,
            y: dp.y
        }

        let rotVP;
        switch(rotation)
        {
        case 0:
            rotVP = {
                x: 0,
                y: 0
            }
            break;

        case 90:
            rotVP = {
                x: canvasWidth,
                y: 0
            }
            break;

        case 180:
            rotVP = {
                x: canvasWidth,
                y: canvasHeight
            }
            break;

        case 270:
            rotVP = {
                x: 0,
                y: canvasHeight
            }
        }

        const rdx = lp.x - rotVP.x;
        const rdy = lp.y - rotVP.y;

        const rad = -rotation * Math.PI / 180
        const cos = Math.cos(rad)
        const sin = Math.sin(rad)

        const dx = rdx * cos - rdy * sin
        const dy = rdy * cos + rdx * sin

        const vpTL = {
            x: 0,
            y: 0
        }

        lp.x = vpTL.x + dx
        lp.y = vpTL.y + dy

        lp.x /= scale
        lp.y /= scale

        return lp;
    }

    function addPoint(e)
    {
        const bbox = svgTasks.getBoundingClientRect()
        
        const x = e.clientX - bbox.x;
        const y = e.clientY - bbox.y;

        const logPt = DPtoLP({x, y})

        pointsArray.push(logPt)
        renderTasks()
    }

    function removePoint(pt)
    {
        pointsArray = remove(pointsArray, pt)
        renderTasks()
    }

    async function lookupDocument(url)
    {
        let entry = pdfs.find(e => e.url == url)
        
        if(!entry)
        {
            const loadingTask = pdfjs.getDocument(url) // todo: loading by reef.fetch
            entry = {
                url: url,
                pdfDocument: null,
                pdfLoadingTask: loadingTask
            }
            pdfs = [entry, ...pdfs];

            entry.pdfDocument = await loadingTask.promise
            return entry.pdfDocument
        }
        
        if(entry.pdfDocument)
            return entry.pdfDocument;

        if(entry.pdfLoadingTask)
        {
            entry.pdfDocument = await entry.pdfLoadingTask.promise
            return entry.pdfDocument;
        }
        else
        {
            console.error('should not happen')
        }
    }

</script>

<div class="w-screen h-screen relative overflow-auto">
    <canvas bind:this={canvasPdf}   class="absolute z-0"/>
    {#key tasksLayerDrawTrigger}
        {#if tasksLayerDrawTrigger > 0}
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <svg    version="1.1"
                    mlns="http://www.w3.org/2000/svg"
                    width={canvasWidth}
                    height={canvasHeight}
                    bind:this={svgTasks} class="absolute z-10" 
                    on:click={addPoint}>

                    {#each pointsArray as lp}
                        {@const dp=LPtoDP(lp)}
                        {@const radius=10*scale}
                        {@const x=dp.x-radius}
                        {@const y=dp.y-radius}
                        <rect   {x} {y} 
                                width={radius*2} 
                                height={radius*2} 
                                fill="green" 
                                on:click={() => removePoint(lp)}
                                class="cursor-pointer"/>
                    {/each}
            </svg>
        {/if}
    {/key}
</div>

