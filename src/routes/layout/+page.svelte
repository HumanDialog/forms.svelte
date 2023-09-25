<script>
    import Layout from '$lib/desk.svelte'
    import {session} from '@humandialog/auth.svelte'

    import Empty from './empty.svelte';
    import FaBars from 'svelte-icons/fa/FaBars.svelte'


    $session.configure( {
                    mode: 'local',
                    local: {
                        api:    "http://localhost:1996/",
                        users:
                        [
                            "alice@example.com",
                            "bob@example.com"
                        ]}
                   });

    const layout = {
                sidebar : {
                    'TOC': {
                        authorized :true,
                        icon: FaBars,
                        component: Empty
                    }
                },
                mainContent : {
                    routes : {
                        '/' :           { component: Empty},
                        '/checklist':   { component: Empty},
                        '/checklist/*': { component: Empty}
                    }
                },
                selectionDetails : {
                    routes : {
                        '/checklist':   { component: Empty},
                        '/checklist/*': { component: Empty}
                    }
                },
                mainToolbar : {
                    darkMode : true
                }
    }


</script>

<Layout {layout}/>