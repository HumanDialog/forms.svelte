<script>
    import PDFPage from './pdf.page.viewer.svelte'

    let pageNo = 1
    let scale = 1.0
    let rotation = 0

    function prevPage(e)
    {
        pageNo = pageNo - 1
    }

    function nextPage(e)
    {
        pageNo = pageNo + 1
    }

    function zoomIn(e)
    {
        scale = scale * 1.1
    }

    function zoomOut(e)
    {
        scale = scale * 0.9
    }

    function rotateRight(e)
    {
        rotation = rotation + 90
    }

    function rotateLeft(e)
    {
        rotation = rotation - 90
    }

</script>

<button class="p-1 bg-stone-300" on:click={prevPage}>prev</button>
page {pageNo}
<button class="p-1 bg-stone-300" on:click={nextPage}>next</button>

<button class="p-1 bg-stone-300" on:click={zoomOut}>zoom out</button>
{(100 * scale).toFixed(0)}%
<button class="p-1 bg-stone-300" on:click={zoomIn}>zoom in</button>

<button class="p-1 bg-stone-300" on:click={rotateLeft}>rotate left</button>
rotation {rotation}
<button class="p-1 bg-stone-300" on:click={rotateRight}>rotate right</button>

{#key pageNo + scale + rotation}
    <PDFPage url="./pdf/compressed.tracemonkey-pldi-09.pdf" {pageNo} {scale} {rotation}/>
{/key}