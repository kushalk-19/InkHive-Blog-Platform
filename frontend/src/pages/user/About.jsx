import { Navbar } from '@/components/user/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Target, Heart, BookOpen, Award, Globe } from 'lucide-react';

const About = () => {
  const features = [
    {
      icon: BookOpen,
      title: "Quality Content",
      description: "We curate and publish high-quality articles from talented writers worldwide."
    },
    {
      icon: Users,
      title: "Community Driven",
      description: "Join a thriving community of readers and writers who share your passions."
    },
    {
      icon: Award,
      title: "Recognition",
      description: "Get recognized for your work through our featured stories program."
    },
    {
      icon: Globe,
      title: "Global Reach",
      description: "Share your stories with readers from around the world."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12 animate-fade-in-up">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-4">
            About InkHive
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Where stories come alive and writers find their voice
          </p>
        </div>

        {/* Mission Section */}
        <Card className="mb-12 animate-fade-in">
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-4">
              <Target className="h-8 w-8 text-primary" />
              <h2 className="text-2xl font-bold">Our Mission</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              InkHive was founded with a simple yet powerful mission: to create a platform where 
              writers of all backgrounds can share their stories, connect with readers, and grow 
              their craft. We believe that everyone has a story worth telling, and we're here to 
              help you tell yours.
            </p>
          </CardContent>
        </Card>

        {/* Story Section */}
        <Card className="mb-12 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-4">
              <Heart className="h-8 w-8 text-primary" />
              <h2 className="text-2xl font-bold">Our Story</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed mb-4">
              InkHive started in 2025 as a passion project by a group of writers and tech enthusiasts 
              who wanted to create a better blogging experience. Frustrated with existing platforms 
              that prioritized ads over content, we set out to build something different.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Today, InkHive has grown into a vibrant community of thousands of writers and readers. 
              We continue to evolve and improve, always keeping our community's needs at the heart 
              of everything we do.
            </p>
          </CardContent>
        </Card>

        {/* Features Grid */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8">What Makes Us Different</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card 
                key={feature.title} 
                className="animate-fade-in hover:shadow-lg transition-shadow"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-6 text-center">
                  <feature.icon className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Contact Section */}
        <Card className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Get In Touch</h2>
            <p className="text-muted-foreground mb-4">
              Have questions or suggestions? We'd love to hear from you!
            </p>
            <p className="text-muted-foreground">
              Email: <span className="text-primary">contact@inkhive.com</span>
            </p>
          </CardContent>
        </Card>
      </main>

      <footer className="border-t mt-16 py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2025 Inkhive. Made with love for writers everywhere.</p>
        </div>
      </footer>
    </div>
  );
};

export default About;