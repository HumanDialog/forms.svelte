<script>
    import {Page
        } from '$lib'

    import {link} from 'svelte-spa-router'
    import {signInHRef} from '@humandialog/auth.svelte'
    
    function getPageOperations() 
    {
        return []
    }

</script>

<Page   self={{}} 
            toolbarOperations={getPageOperations()}
            clearsContext='sel props'
            title="Unauthorized">

     <section class="w-full flex justify-center">
        <article class="w-full prose prose-base prose-zinc dark:prose-invert mx-2  mb-64">
            <h1>
                Sign in
            </h1>

            <p class="lead">
                You want to see content that is available disabled for logged-in users. 
            </p>

            <p>
                <a href={$signInHRef}>Sign in</a> to see page content.<br>
                If you don't have an account yet, <a href="/tcontact" use:link>contact us</a> so we can send you an invitation link for free.
            </p>

        </article>
    </section>
</Page>