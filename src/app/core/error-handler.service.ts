import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {

  constructor(private messageService: MessageService) { }

  handler(errorResponse: any) {
    let msg = ''

    if (typeof errorResponse === 'string') {
      msg = errorResponse
    } else if (errorResponse instanceof HttpErrorResponse && errorResponse.status >= 400 && errorResponse.status <= 499) {
      msg = 'Ocorreu um erro ao processar a sua requisição.';
      try {
        msg = errorResponse.error[0].mensagemUsuario;
      } catch (error) { }
      console.log('Ocorreu um erro: ', errorResponse);
    } else {
      msg = 'Erro ao processar serviço remoto. Tente novamente, ou chame o administrador do sistema.'
      console.log('Ocorreu um erro: ', errorResponse);
    }

    this.messageService.add({
      severity: 'error',
      summary: 'Opss...',
      detail: msg,
      life: 8000
    })
  }
}
