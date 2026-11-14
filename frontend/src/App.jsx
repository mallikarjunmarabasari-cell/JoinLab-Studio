// import WelcomeMessage from "./components/WelcomeMessage.jsx";
// import './App.css'
import SqlWorkspace from "./components/SqlWorkspace.jsx";
function App() {
  return (
    <main>

      {/* <WelcomeMessage
        title="JoinLab Studio"
        tagline="Learn SQL. Design relational databases. Build with your own data."
      /> */}
      {/* App passes two properties:
        - title
        - tagline
      WelcomeMessage receives those properties through its props parameter. */}

      {/* <WelcomeMessage
        title="PostgreSQL Lab"
        tagline="Design schemas. Execute queries. Explore databases."
      /> */}



      <SqlWorkspace />


    </main>
  )
}
export default App