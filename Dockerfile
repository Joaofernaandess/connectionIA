FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY ./Pedido.Server/Pedido.Server.csproj ./Pedido.Server/
COPY ./Pedido.Domain/Pedido.Domain.csproj ./Pedido.Domain/
COPY ./Pedido.Data/Pedido.Data.csproj ./Pedido.Data/
COPY ./Pedido.Infra/Pedido.Infra.csproj ./Pedido.Infra/
RUN dotnet restore ./Pedido.Server/Pedido.Server.csproj

COPY . .

WORKDIR /src/Pedido.Server

RUN dotnet publish -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production
ENV zenite_jwt_auth=""

EXPOSE 8080

ENTRYPOINT ["dotnet", "Pedido.Server.dll"]
