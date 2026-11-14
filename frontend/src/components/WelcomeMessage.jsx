function WelcomeMessage({ title, tagline }){ /* defines a component */
    return( /* describes the UI using JSX */
        <header> {/*h1 is an HTML semantic element */}

            {/*Currently, your component has hardcoded text: <h1>JoinLab Studio</h1> */}
            {/* when we want to reuse the same component with different titles */}
            {/* This is where props (properties) come in */}
            <h1>{title}</h1> {/* props (properties) allow a parent component to pass data to a child component */}
            <p>{tagline}</p> {/* Here, props is an object containing the values passed by the parent  */}
        </header>
    )
}
export default WelcomeMessage //export default makes the component importable from another file