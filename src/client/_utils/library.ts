const libraries = new Map<string, unknown>();

export function setLibrary(name: string, library: unknown): void {
  libraries.set(name, library);
}

export async function getLibrary(name: 'geotiff'): Promise<typeof import('geotiff')>;
export async function getLibrary(name: string): Promise<unknown> {
  if (libraries.has(name)) {
    return libraries.get(name);
  }

  try {
    switch (name) {
      case 'geotiff': return await import('geotiff');
    }
  } catch (e) {
    throw new Error(`Optional dependency '${name}' is missing, install it with a package manager or provide with \`WeatherLayersClient.setLibrary('${name}', library)\``, { cause: e });
  }
}