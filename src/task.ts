export abstract class Task {
  abstract run(): Promise<boolean>;
}
