
<script>
    let userClass = $$props.class ?? ""
</script>

<!--img src="/ico/TILOS.svg" alt="" class={userClass}/-->

<svg version="1.0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48.000000 48.000000" preserveAspectRatio="xMidYMid meet" {...$$props}>
    <g transform="translate(0.000000,48.000000) scale(0.100000,-0.100000)" stroke="none">
        <path d="M160 467 c-49 -16 -133 -102 -148 -153 -28 -94 -8 -169 63 -239 65 
                -66 99 -75 269 -75 l136 0 0 136 c0 170 -9 204 -75 269 -70 71 -152 91 -245
                62z m157 -107 c87 -52 83 -198 -6 -245 -98 -50 -211 16 -211 123 0 85 56 142
                140 142 27 0 58 -8 77 -20z"/>
        <path d="M218 293 c-3 -34 0 -63 6 -69 6 -6 35 -9 69 -6 48 3 57 7 57 23 0 16
                -7 19 -45 19 l-45 0 0 45 c0 38 -3 45 -19 45 -16 0 -20 -9 -23 -57z"/>
    </g>
</svg>

<style>
    svg {
        stroke: currentColor;
        fill: currentColor;
        stroke-width: 0;
        width: 100%;
        height: auto;
        max-height: 100%;
    }  
</style>