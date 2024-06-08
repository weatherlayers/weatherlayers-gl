const libraries = new Map<string, unknown>();

export function setLibrary<T>(name: string, library: T): void {
  libraries.set(name, library);
}

export async function getLibrary<T>(name: string): Promise<T> {
  try {
    return libraries.get(name) ?? await import(name);
  } catch (e) {
    throw new Error(`Optional dependency '${name}' is missing, install it with a package manager or provide with \`WeatherLayersClient.setLibrary('${name}', library)\``, { cause: e });
  }
}