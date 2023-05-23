import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, NgForm, Validators } from '@angular/forms';

import { MessageService } from 'primeng/api';

import { Lancamento } from 'src/app/core/model';
import { PessoasService } from 'src/app/pessoas/pessoas.service';
import { ErrorHandlerService } from 'src/app/core/error-handler.service';
import { CategoriasService } from 'src/app/categorias/categorias.service';

import { LancamentoService } from '../lancamento.service';

@Component({
  selector: 'app-lancamento-cadastro',
  templateUrl: './lancamento-cadastro.component.html',
  styleUrls: ['./lancamento-cadastro.component.css']
})
export class LancamentoCadastroComponent implements OnInit {

  value: string = "RECEITA";
  lancamento = new Lancamento();
  tipos: any[];
  categorias: any[] = [];
  pessoas: any[] = [];
  formulario!: FormGroup;

  constructor(
    private pessoasService: PessoasService,
    private categoriaService: CategoriasService,
    private lancamentoService: LancamentoService,
    private messageService: MessageService,
    private errorHandler: ErrorHandlerService,
    private activeRouter: ActivatedRoute,
    private router: Router,
    private title: Title,
    private formbuilder: FormBuilder
  ) { 
    this.tipos = [{label: 'Receita', value: 'RECEITA'}, {label: 'Despesa', value: 'DESPESA'}];
  }

  ngOnInit(): void {
    this.configuraFormulario();
    const codigoLancamento = this.activeRouter.snapshot.params['codigo'];

    this.title.setTitle('Novo Lançamento')
    
    if (codigoLancamento) {
      this.carregarLancamento(codigoLancamento);
    } else {
      this.carregaPessoas();
      this.carregarCategorias();
    }
  }
  
  get editando(){
    return Boolean(this.activeRouter.snapshot.params['codigo']);
  }

  configuraFormulario(): void {
    this.formulario = this.formbuilder.group({
              codigo: [],
                tipo: [ 'RECEITA', Validators.required ],
      dataVencimento: [ null, Validators.required ],
       dataPagamento: [],
           descricao: [ null, [ Validators.required, Validators.minLength(5) ] ],
               valor: [ null, Validators.required ],
           categoria: this.formbuilder.group({
                        codigo: [ null, Validators.required ],
                          nome: [],
                      }),
              pessoa: this.formbuilder.group({
                        codigo: [ null, Validators.required ],
                          nome: []
                      }),
          observacao: [],
    });
  }
   
  carregarLancamento(codigo: number) {
    this.lancamentoService.buscarPorCodigo(codigo)
    .then((lancamento) => {
      this.converterDataParaString([lancamento]);
      this.lancamento = lancamento;
      this.carregaPessoas();
      this.carregarCategorias();
      this.atualizarTituloEdicao();
    })
    .catch(erro => this.errorHandler.handler(erro))
  }

  salvar(form: NgForm) {
    if (this.editando) {
      this.atualizarLancamento(form);
    } else {
      this.adicioinarLancamento(form);
    }
  }

  adicioinarLancamento(form: NgForm) {
    this.lancamentoService.adicionar(this.lancamento)
      .then((lancamentoAdicionado) =>{
        this.messageService.add({
          severity: 'success',
          summary: 'Cadastro de Lancamento',
          detail: 'Lançamento cadastrado com sucesso.'
        })

        this.router.navigate(['lancamentos', lancamentoAdicionado.codigo])
      })
      .catch(erro => this.errorHandler.handler(erro))
  }

  /*TODO: Aberto uma issue (Edição de Lançamento #2 - https://github.com/CarlosEReis/ER7Money-API/issues/2), pois
  não é possível editar um lançamento, com uma pessoa inativa*/
  atualizarLancamento(form: NgForm) {
    this.lancamentoService.atualizar(this.lancamento)
      .then(
        (lancamento) => {
          this.converterDataParaString([lancamento])
          this.lancamento = lancamento;
          this.messageService.add({
            severity: 'success',
            summary: 'Edição de Lançamento',
            detail: 'Lancamento editado com sucesso.'
          })
          this.atualizarTituloEdicao();
        }
      )
      .catch(erro => this.errorHandler.handler(erro))
  }

  carregarCategorias() {
    this.categoriaService.listarTodas()
    .then(
      (categorias) => {
        this.categorias = 
          categorias.map((categoria: any) => ({ label: categoria.nome, value: categoria.codigo}))
    })
    .catch(erro => this.errorHandler.handler(erro));
  }

  carregaPessoas() {
    this.pessoasService.listarTodas()
    .then(
      (pessoas) => {
        if(this.editando) {
          this.pessoas = pessoas
          .filter((pessoa: any) => pessoa.ativo || (pessoa.codigo === this.lancamento.pessoa.codigo))
          .map((pessoa: any) => ({ label: pessoa.nome, value: pessoa.codigo }))
        } else {
          this.pessoas = pessoas
            .filter((pessoa: any) => pessoa.ativo)
            .map((pessoa: any) => ({ label: pessoa.nome, value: pessoa.codigo }) )
        }
      }
    )
    .catch(erro => this.errorHandler.handler(erro))
  }

  novo(form: NgForm) {
    form.reset();
    setTimeout(() => {
      this.lancamento = new Lancamento();
    }, 1);
    this.router.navigate(['/lancamentos/novo']);
  }

  private converterDataParaString(lancamentos: Lancamento[]) {
    for(const lancamento of lancamentos) {
      let offset = new Date().getTimezoneOffset() * 60000;
      lancamento.dataVencimento = new Date(new Date(lancamento.dataVencimento!).getTime() + offset);
      if (lancamento.dataPagamento) {
        lancamento.dataPagamento = new Date(new Date(lancamento.dataPagamento!).getTime() + offset);
      }
    }
  }

  private atualizarTituloEdicao() {
    this.title.setTitle(`Edição de Lançamento: ${this.lancamento.descricao}`)
  }
}
