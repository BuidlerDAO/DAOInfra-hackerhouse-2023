import CardsList from "@/components/ProjectCard/ProjectCard";
import mediaCardData from "@/data/mediaCrad";
import ProjectBar from "@/components/ProjectBar/ProjectBar";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col p-6">
        <ProjectBar />
      <CardsList cardsData={mediaCardData} />
    </main>
  )
}
