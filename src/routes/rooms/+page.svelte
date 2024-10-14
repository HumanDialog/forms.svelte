<script>
    import {Layout} from '$lib'
    import {reef} from '@humandialog/auth.svelte'
    import Main from './Main.svelte'
    import Nav from './Nav.svelte'
    import AppIcon from './appicon.svelte'
	import Reservations from './Reservations.svelte';
    
    reef.configure( {
                    mode: 'local',
                    local: {
                        api:    "http://127.0.0.1:1996/",
                        users:
                        [
                            "Alice",
                            "Bob"
                        ],
                        apiVersion: "v001"}
                   });


    const layout = {
                sidebar : {
                    'TOC': {
                        authorized :true,
                        icon: AppIcon,
                        component: Nav
                    }
                },
                mainContent : {
                    routes : {
                        '/' :           { component: Main},
                        '/reservations' :{ component: Reservations}
                    }
                },
                mainToolbar : {
                    signin: true
                },
                dark:
                {
                    optional: true,
                    default: false
                }
    }

    
</script>


<Layout {layout} />

      