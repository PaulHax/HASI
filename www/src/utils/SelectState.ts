import { ContextConsumer } from '@lit-labs/context';
import { ReactiveController, ReactiveElement } from 'lit';
import { InterpreterFrom, Subscribable } from 'xstate';
import { hasiContext, HasiMachine } from '../state/hasi.machine';
import { SelectorController } from './SelectController';

const defaultCompare = (a: any, b: any) => a === b;

type HasiService = InterpreterFrom<HasiMachine>;
export class SelectState<
  T,
  TEmitted = HasiService extends Subscribable<infer Emitted> ? Emitted : never
> implements ReactiveController
{
  private serviceContext: ContextConsumer<typeof hasiContext, ReactiveElement>;
  private selectorController?: SelectorController<HasiService, T, TEmitted>;
  private host: ReactiveElement;

  private selector: (emitted: TEmitted) => T;
  compare: (a: T, b: T) => boolean = defaultCompare; // is current value same as old value?

  constructor(
    host: ReactiveElement,
    selector: (emitted: TEmitted) => T,
    compare: (a: T, b: T) => boolean = defaultCompare
  ) {
    (this.host = host).addController(this);
    this.serviceContext = new ContextConsumer(
      this.host,
      hasiContext,
      undefined,
      true
    );
    this.selector = selector;
    this.compare = compare;
  }

  hostConnected() {
    // has hostConnected already been called?
    if (this.selectorController) {
      this.hostDisconnected();
    }
    this.serviceContext.hostConnected();
    this.selectorController = new SelectorController(
      this.host,
      this.serviceContext.value!.service,
      this.selector,
      this.compare
    );
  }

  hostDisconnected() {
    this.serviceContext?.hostDisconnected();
    this.selectorController?.hostDisconnected();
  }

  selected() {
    return this.selectorController?.selected();
  }
}

export function connectState<
  T,
  TEmitted = InterpreterFrom<HasiMachine> extends Subscribable<infer Emitted>
    ? Emitted
    : never
>(
  host: ReactiveElement,
  selector: (emitted: TEmitted) => T,
  compare: (a: T, b: T) => boolean = defaultCompare
) {
  return new SelectState(host, selector, compare);
}

export const compareArrays = (a: unknown[], b: unknown[]) =>
  a.length === b.length && a.every((value, idx) => value === b[idx]);
