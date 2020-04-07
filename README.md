# node-rpi-rxjs-service
Node service with rpi-gpio package and RxJs for GPIO control on Raspberry Pi 3 B

Para instalar o Node, utilize NVM com NODE 12:
```
git clone https://github.com/creationix/nvm.git ~/.nvm

sudo echo "source ~/.nvm/nvm.sh" >> ~/.bashrc && sudo echo "source ~/.nvm/nvm.sh" >> ~/.profile

nvm install v12.14.1
```


### Instalation
`npm install`

### Run
`npm start`

Or specify file using node:

`node index.js`

## Instruções

Ao iniciar o programa as seguintes opções estão disponíveis:

 - Tecla `1`: Seleciona o pino `11` (`GPIO 17`) no modo OUT para controlar Relé. Para alterar a porta, mudar a constante no arquivo `gpioController.js`
    - Tecla `2` dispara um evento que marca a porta do Relé como ativa (`true`).
    - Tecla `3` dispara um evento que marca a porta do Relé como inativa (`false`).
    - Tecla `4` cancela o processo que utiliza a porta, marcando como inativa ao terminar.

 - Tecla `5`: Inicia um EventEmmiter que lê o modulo de RFID a cada segundo, finalizando o processo uma vez que for lido, apresentando os dados da tag em tela.

 - Tecla `6`: Inicia um EventEmmiter que lê o modulo de RFID a cada segundo, quando lido uma tag, inicia o procedimento de consumo:
    1. Marca a porta do relé como ativa
    2. Começa a ouvir o fluxometro mostrando o evento de alteração do estado da porta `13` (`GPIO 27`)
    3. Ao contar o equivalente a 50 Mls, a porta do relé é marcada como inativa e o procedimento de consumo é finalizado.
 
 - Tecla ` ` (espaço): Inicia uma função asincrona que mostra no console o evento de alteração do estado da porta `13` (`GPIO 27`)
    - Tecla `x` finliza a função de leitura da porta `13`

 - Tecla `\r` (enter): Inicia um procedimento de consumo:
    1. Marca a porta do relé como ativa
    2. Começa a ouvir o fluxometro mostrando o evento de alteração do estado da porta `13` (`GPIO 27`)
    3. Ao contar o equivalente a 100 Mls, a porta do relé é marcada como inativa e o procedimento de consumo é finalizado.

- Tecla `\u0003` (**CTRL + C**): Termina o programa.
