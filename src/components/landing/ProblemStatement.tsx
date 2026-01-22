import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const problems = [
  {
    title: 'Messy Planning',
    description:
      'No more scattered Google Docs and spreadsheets. Keep everything organized in one place.',
  },
  {
    title: 'No Personalization',
    description:
      'Generic travel guides miss your preferences. Get recommendations tailored to your style.',
  },
  {
    title: 'Hard to Edit',
    description: 'Plans change. Easily drag and drop activities, with smart conflict detection.',
  },
];

export function ProblemStatement() {
  return (
    <section className="py-16 px-4 bg-muted/50">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
          Trip planning should be easy
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {problems.map((problem) => (
            <Card key={problem.title} className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">{problem.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{problem.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
