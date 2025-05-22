<script>
    import {Page
        } from '$lib'

    import {signInHRef, signUpHRef} from '@humandialog/auth.svelte'
    
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
                If you don't have an account yet, you can <a href={$signUpHRef}>Sign up</a> for free.
            </p>

        </article>
    </section>
</Page>