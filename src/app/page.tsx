'use client';

import {useState, useCallback} from 'react';
import {analyzeImage} from '@/ai/flows/analyze-image';
import {generateRecipe} from '@/ai/flows/generate-recipe';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {ImageIcon, Loader2} from 'lucide-react';
import {useToast} from '@/hooks/use-toast';
import {useDropzone} from 'react-dropzone';
import {Alert, AlertDescription, AlertTitle} from '@/components/ui/alert';

export default function Home() {
  const [image, setImage] = useState<string | null>(null);
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [recipe, setRecipe] = useState<{
    recipeName: string;
    ingredients: string[];
    instructions: string[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const {toast} = useToast();

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImage(base64String);
      };
      reader.readAsDataURL(file);
    },
    [setImage]
  );

  const {getRootProps, getInputProps, isDragActive} = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.png', '.jpg'],
    },
    maxFiles: 1,
    multiple: false,
  });

  const handleAnalyzeImage = async () => {
    if (!image) {
      toast({
        variant: 'destructive',
        title: 'No image uploaded',
        description: 'Please upload an image first.',
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await analyzeImage({photoDataUri: image});
      setIngredients(result.ingredients);

      if (result.ingredients.length > 0) {
        const recipeResult = await generateRecipe({
          ingredients: result.ingredients.join(', '),
        });
        setRecipe(recipeResult);
      } else {
        toast({
          variant: 'destructive',
          title: 'No ingredients found',
          description: 'Could not identify any ingredients in the image.',
        });
      }
    } catch (error) {
      console.error('Error analyzing image:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to analyze image. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="flex flex-col items-center justify-start min-h-screen py-10 bg-cover bg-center"
      style={{
        backgroundImage: "url('/ingredients-bg.jpg')",
      }}
    >
      <div className="absolute inset-0 bg-background opacity-80 z-0"></div>
      <h1 className="text-4xl font-bold mb-6 text-foreground relative z-10" style={{ fontFamily: 'Billabong' }}>Recipe Snap</h1>

      <Card className="w-full max-w-md space-y-4 p-4 rounded-lg shadow-md relative z-10">
        <CardHeader>
          <CardTitle>Upload Image</CardTitle>
          <CardDescription>
            Drag and drop an image, or click to select files
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col space-y-4">
          <div
            {...getRootProps()}
            className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-md cursor-pointer bg-secondary hover:bg-secondary/80 transition-colors"
          >
            <input {...getInputProps()} className="hidden" id="image-upload" />
            {isDragActive ? (
              <p className="text-muted-foreground">Drop the files here ...</p>
            ) : (
              <div className="text-center">
                <ImageIcon className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Drag 'n' drop some files here, or{' '}
                  <label htmlFor="image-upload" className="underline cursor-pointer text-accent">
                    click to select files
                  </label>
                </p>
              </div>
            )}
          </div>

          {image && (
            <img
              src={image}
              alt="Uploaded Ingredients"
              className="rounded-md max-h-48 object-contain mb-4 shadow-sm"
            />
          )}
          <Button
            onClick={handleAnalyzeImage}
            disabled={isLoading}
            className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-full py-3 font-semibold transition-colors"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <ImageIcon className="mr-2 h-4 w-4" />
                Analyze Image
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {ingredients.length > 0 && (
        <Card className="w-full max-w-md mt-6 p-4 rounded-lg shadow-md relative z-10">
          <CardHeader>
            <CardTitle>Identified Ingredients</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside">
              {ingredients.map((ingredient, index) => (
                <li key={index}>{ingredient}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {recipe && (
        <Card className="w-full max-w-md mt-6 p-4 rounded-lg shadow-md relative z-10">
          <CardHeader>
            <CardTitle>{recipe.recipeName}</CardTitle>
            <CardDescription>
              Here's a recipe we've generated for you.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Ingredients:</h3>
              <ul className="list-disc list-inside">
                {recipe.ingredients.map((ingredient, index) => (
                  <li key={index}>{ingredient}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Instructions:</h3>
              <ol className="list-decimal list-inside">
                {recipe.instructions.map((instruction, index) => (
                  <li key={index}>{instruction}</li>
                ))}
              </ol>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
